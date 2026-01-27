# app/main.py
from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response

# Importamos Part (Necesario para el modo multimodal)
from vertexai.preview.generative_models import Part 

# Importaciones locales
from .models import MemoryUpdate
from .services import model, procesar_fuentes, crear_pdf_binario

app = FastAPI(title="UniBot API - Medicarama")

# Montar estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variable global de memoria
chat_history = [] 

# --- ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "UniBot Medicarama Online 🩺"}

@app.post("/chat")
async def chat_endpoint(
    texto: str = Form(""),               
    archivo: UploadFile = File(None)     
):
    try:
        print(f"📩 Recibido -> Texto: '{texto}' | Archivo: {archivo.filename if archivo else 'Ninguno'}")

        if not texto and not archivo:
            return {"respuesta": "Por favor, escribe algo o sube un archivo."}

        # --- A. MODO MULTIMODAL (SI HAY ARCHIVO) ---
        if archivo:
            print("🚀 Procesando MODO MULTIMODAL (Texto + Archivo)...")
            
            # Leemos el archivo
            contenido_archivo = await archivo.read()
            tipo_mime = archivo.content_type
            print(f"📎 Archivo: {len(contenido_archivo)} bytes, tipo: {tipo_mime}")

            # En este modo, TODO deben ser objetos 'Part' para que no choque
            partes_envio = []
            
            if texto:
                partes_envio.append(Part.from_text(texto)) # Texto convertido a Objeto Part
            
            partes_envio.append(Part.from_data(
                data=contenido_archivo, 
                mime_type=tipo_mime
            )) # Archivo convertido a Objeto Part

            # Enviamos DIRECTAMENTE la lista de objetos Part (sin historial previo para evitar errores)
            response = model.generate_content(partes_envio)

            # Log para el historial (solo texto)
            chat_history.append({
                "role": "user", 
                "parts": [{"text": texto + f" [Adjunto: {archivo.filename}]"}]
            })

        # --- B. MODO TEXTO (SI NO HAY ARCHIVO) ---
        else:
            print("💬 Procesando MODO TEXTO (Con historial)...")
            
            # En este modo, TODO son diccionarios simples para máxima estabilidad
            contexto_vertex = []
            
            # 1. Reconstruimos historial
            for msg in chat_history[-10:]:
                parts_list = msg.get("parts", [])
                if parts_list and "text" in parts_list[0]:
                    txt = parts_list[0]["text"]
                    contexto_vertex.append({
                        "role": msg["role"],
                        "parts": [{"text": txt}] # Diccionario
                    })
            
            # 2. Añadimos mensaje actual
            contexto_vertex.append({
                "role": "user",
                "parts": [{"text": texto}] # Diccionario
            })
            
            response = model.generate_content(contexto_vertex)
            
            # Log para el historial
            chat_history.append({
                "role": "user", 
                "parts": [{"text": texto}]
            })

        # --- PROCESAR RESPUESTA ---
        bot_reply = response.text
        fuentes_reales = procesar_fuentes(response)
        
        # Guardar respuesta del bot
        chat_history.append({
            "role": "model", 
            "parts": [{"text": bot_reply}]
        })
        
        return {
            "respuesta": bot_reply, 
            "fuentes": fuentes_reales
        }

    except Exception as e:
        print(f"❌ CRASH en /chat: {e}")
        # Limpieza de emergencia del historial si falla el último mensaje
        if chat_history and chat_history[-1]["role"] == "user":
            chat_history.pop()
        return {"respuesta": "Hubo un error técnico. Por favor, intenta subir un archivo diferente o reformula.", "error": str(e)}

@app.post("/generate_pdf_file")
async def generate_pdf_file(data: MemoryUpdate):
    try:
        conversation_text = ""
        for msg in data.messages:
            role = "Alumno" if msg.role == "user" else "Tutor"
            conversation_text += f"{role}: {msg.text}\n\n"

        prompt = f"""
        Actúa como un editor médico. Transforma este chat en APUNTES DE ESTUDIO.
        REGLAS:
        - NO uses formato Chat.
        - Usa '#' para Títulos principales.
        - Usa '##' para Subtítulos.
        - Usa '-' para listas.
        
        Chat original:
        {conversation_text}
        """

        gemini_response = model.generate_content(prompt)
        raw_text = gemini_response.text

        pdf_bytes = crear_pdf_binario(raw_text)
        return Response(content=pdf_bytes, media_type="application/pdf")

    except Exception as e:
        print(f"❌ Error PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_memory")
async def update_memory(request: Request):
    global chat_history
    try:
        data = await request.json()
        messages = data.get("messages", [])
        
        formatted_history = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            if m["text"]:
                formatted_history.append({
                    "role": role, 
                    "parts": [{"text": m["text"]}]
                })
        
        chat_history = formatted_history
        return {"status": "ok"}
    except Exception as e:
        print(f"❌ Error memoria: {e}")
        return {"status": "error", "detail": str(e)}