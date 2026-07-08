from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, FileResponse, JSONResponse, StreamingResponse
from fastapi.concurrency import run_in_threadpool
from typing import Optional, List
import base64
import json
from io import BytesIO

# Importaciones de Vertex AI
import vertexai
from google import genai
from google.genai import types as genai_types
from vertexai.generative_models import GenerativeModel, Part

# Firebase Admin SDK (verificación de tokens emitidos por Firebase Auth)
import firebase_admin
from firebase_admin import auth as firebase_auth

from .models import MemoryUpdate
from .services import model_capeo, model_multimodal, procesar_fuentes, crear_pdf_binario
from .config import PROJECT_ID, REGION, LIMITE_TOKENS_DIA
from .retrieval import (
    get_user_course_ids, get_user_cursos, buscar_contexto, curso_tiene_material,
    pdfs_de_curso, tokens_usados_hoy, sumar_tokens,
)

app = FastAPI(title="UniBot API - Medicarama")

# Inicializa Firebase Admin SDK (idempotente: solo arranca una vez)
# Local: usa Application Default Credentials (gcloud auth application-default login)
# Cloud Run: usa la service account adjunta automáticamente
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": PROJECT_ID})


async def verify_firebase_token(request: Request) -> dict:
    """Valida el ID token de Firebase del header Authorization.

    Devuelve las claims (uid, email, email_verified, etc.) si todo OK.
    Aborta con HTTP 401/403 si falta token, está caducado, o el email
    no ha sido verificado.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing_token")

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="empty_token")

    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="token_expired")
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="token_revoked")
    except firebase_auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"invalid_token: {e}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"token_verification_failed: {e}")

    if not decoded.get("email_verified", False):
        raise HTTPException(status_code=403, detail="email_not_verified")

    return decoded

# --- GENERACIÓN DE IMAGEN (SDK google-genai) ---
# El SDK antiguo `vertexai.preview.vision_models` dejó de resolver Imagen tras
# la retirada de jun-2026 (daba 403 "not visible" aunque el modelo existiera).
# Migrado al SDK nuevo `google-genai`. Verificado: en este proyecto/región el
# único Imagen disponible es imagen-3.0-generate-001; los demás quedan de
# reserva por si cambia la disponibilidad (cascada: usa el primero que responda).
_MODELOS_IMAGEN = [
    "imagen-3.0-generate-001",   # ÚNICO disponible ahora (verificado)
    "imagen-3.0-generate-002",
    "imagen-4.0-generate-001",
]
_genai_client = None


def _genai_cli():
    global _genai_client
    if _genai_client is None:
        _genai_client = genai.Client(
            vertexai=True, project=PROJECT_ID, location=REGION)
    return _genai_client


def generar_imagen(prompt):
    """Genera 1 imagen (bytes) con google-genai, probando modelos en cascada.
    Devuelve los bytes de la imagen, o None si ninguno responde."""
    cli = _genai_cli()
    ultimo = None
    for nombre in _MODELOS_IMAGEN:
        try:
            r = cli.models.generate_images(
                model=nombre, prompt=prompt,
                config=genai_types.GenerateImagesConfig(
                    number_of_images=1, aspect_ratio="1:1"))
            if r.generated_images:
                print(f"Imagen generada con: {nombre}")
                return r.generated_images[0].image.image_bytes
        except Exception as e:  # noqa: BLE001
            ultimo = e
            print(f"Imagen: '{nombre}' no disponible ({str(e)[:120]})")
    print(f"Alerta: ningún modelo de imagen respondió. Último error: {ultimo}")
    return None

# 1. CORS (Permisos para que el navegador no bloquee)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Cabeceras de seguridad defensa-en-profundidad.
# Aplican a TODAS las respuestas (estáticos y endpoints).
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Evita que el navegador adivine MIME types (mitiga XSS por uploads)
    response.headers["X-Content-Type-Options"] = "nosniff"
    # Anti-clickjacking: nadie puede meter esta web en un iframe
    response.headers["X-Frame-Options"] = "DENY"
    # Fuerza HTTPS durante 1 año, incluyendo subdominios
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # Limita la info de Referer enviada a sitios externos
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Restringe acceso a APIs sensibles del navegador (geolocalización, cámara, etc.)
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(self), payment=()"
    return response


# 3. Montar carpeta estática (CSS, JS, Imágenes)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Historial de chats POR USUARIO (uid -> lista de mensajes).
# Sustituye al antiguo `chat_history` global compartido, que mezclaba
# contextos de usuarios concurrentes. Sigue siendo memoria efímera del
# proceso (no sobrevive a reinicios; con varias instancias Cloud Run el
# estado se distribuye). El frontend re-sincroniza vía /update_memory.
chat_history_per_uid: dict[str, list] = {}

# Última imagen generada por usuario, para poder describirla en el mensaje
# siguiente (p. ej. "¿qué enfermedad tiene?"). Dict aparte -> sobrevive al
# /update_memory del front; con session-affinity el usuario cae en la misma
# instancia. {uid: {"desc": str, "ts": epoch}}.
import time as _time
_ultima_imagen: dict[str, dict] = {}


def get_user_history(uid: str) -> list:
    """Obtiene la lista mutable de historial de un usuario; la crea vacía si no existe."""
    if uid not in chat_history_per_uid:
        chat_history_per_uid[uid] = []
    return chat_history_per_uid[uid]


# --- ENDPOINTS ---

@app.get("/")
async def root():
    # Devuelve el HTML visual
    return FileResponse('index.html')


@app.get("/healthz")
async def healthz():
    """Liveness probe para Cloud Run. Siempre 200 OK si el proceso está vivo."""
    return {"status": "ok"}

@app.post("/chat")
async def chat_endpoint(
    texto: str = Form(...),                                  # Texto del formulario
    archivos: List[UploadFile] = File(default=[]),          # Lista de archivos (puede estar vacía)
    user: dict = Depends(verify_firebase_token)              # Token verificado
):
    try:
        nombres = [a.filename for a in archivos] if archivos else []
        print(f"[uid={user.get('uid')} email={user.get('email')}] Recibido -> Texto: '{texto}' | Archivos: {nombres or 'Ninguno'}")

        # Tope de seguridad: máximo 5 archivos por petición (alineado con frontend)
        if archivos and len(archivos) > 5:
            return JSONResponse(
                status_code=400,
                content={"respuesta": "Máximo 5 archivos por mensaje.", "error": "too_many_files"}
            )

        # Validación básica
        if not texto and not archivos:
            return {"respuesta": "Por favor, escribe algo o sube un archivo."}

        # --- A. MODO ARTISTA (GENERAR IMAGEN) ---
        # Detectamos si el usuario quiere dibujar
        if texto and (texto.lower().startswith("/img") ):
            print("Detectado modo IMAGEN...")

            # Limpiamos el prompt (quitamos el comando inicial)
            prompt_imagen = texto.replace("/img", "").replace("Dibuja", "", 1).strip()
            
            if not prompt_imagen:
                return {"respuesta": "Por favor, describe qué quieres que dibuje después de '/img'."}

            estilo_medico = "Ilustración médica profesional, estilo atlas de anatomía (Netter), realista, detallado, fondo blanco limpio, educativo, alta resolución: "
            
            # Combinamos tu petición con el estilo forzado
            prompt_final = estilo_medico + prompt_imagen

            try:
                # Generamos la imagen con el SDK google-genai (cascada de modelos)
                img_bytes = await run_in_threadpool(generar_imagen, prompt_final)
                if not img_bytes:
                    return {"respuesta": "Lo siento, el generador de imágenes no está disponible ahora mismo."}
                img_base64 = base64.b64encode(img_bytes).decode("utf-8")

                # Generamos POR DETRÁS una descripción concreta de la enfermedad
                # que ilustra la imagen (con el material del curso) y la guardamos
                # en el contexto (nota_historial, oculta, no se muestra). Así un
                # follow-up "¿qué enfermedad tiene?" responde seguro y concreto,
                # sin depender de que el modelo "conecte" el dibujo.
                nota = f"He generado una ilustración de «{prompt_imagen}»."
                try:
                    uid = user["uid"]
                    course_ids = get_user_course_ids(uid)
                    ctx = ""
                    if course_ids:
                        ctx, _ = buscar_contexto(prompt_imagen, course_ids, k=6)
                    desc_prompt = (
                        "MIRA la ilustración que se adjunta (la acabas de generar "
                        f"a partir de la petición «{prompt_imagen}»). En 2-3 frases, "
                        "describe QUÉ se ve en ella y qué enfermedad o condición "
                        "CONCRETA y plausible representa (empieza por el nombre de "
                        "la enfermedad). Apóyate en el material de abajo si lo hay. "
                        "No digas que no puedes ver imágenes: la tienes delante.\n\n"
                        "=== MATERIAL ===\n" + (ctx or "(sin material específico)")
                    )
                    # Vision: le pasamos la IMAGEN real generada + el prompt, para
                    # que la descripción salga de mirar la foto, no del texto.
                    entrada = [
                        Part.from_data(data=img_bytes, mime_type="image/png"),
                        Part.from_text(desc_prompt),
                    ]
                    resp = await run_in_threadpool(
                        model_capeo.generate_content, entrada)
                    if getattr(resp, "text", ""):
                        nota = (
                            f"He generado una ilustración de «{prompt_imagen}». "
                            f"Esta ilustración representa: {resp.text.strip()}")
                except Exception as e:  # noqa: BLE001
                    print(f"No se pudo generar la descripción de la imagen: {e}")

                _ultima_imagen[user["uid"]] = {"desc": nota, "ts": _time.time()}
                return {
                    "imagen_base64": img_base64,
                    "nota_historial": nota,
                    "fuentes": []
                }
            except Exception as img_error:
                print(f"Error generando imagen: {img_error}")
                return {"respuesta": "Hubo un error al intentar generar la imagen. Intenta con una descripción diferente o más corta."}

        # --- B. MODO MULTIMODAL (SI HAY ARCHIVOS) — NO streaming, CAPADO ---
        if archivos:
            print(f"Procesando MODO MULTIMODAL (Texto + {len(archivos)} archivo/s)...")
            uid = user["uid"]

            # Tope de consumo diario por alumno (igual que en el path de texto).
            try:
                if tokens_usados_hoy(uid) >= LIMITE_TOKENS_DIA:
                    return JSONResponse(content={
                        "respuesta": ("Has alcanzado tu límite de uso por hoy. "
                                      "Vuelve mañana para seguir estudiando."),
                        "fuentes": []
                    })
            except Exception as e:
                print(f"Error comprobando tope (multimodal, uid={uid}): {e}")

            # CAPEO: material de los cursos COMPRADOS (filtrado), igual que en
            # el path de texto. Se INYECTA en el prompt (no grounding) -> nunca
            # se filtra material de cursos no comprados. Los docs ABIERTOS y TFG
            # sí llegan por grounding (model_multimodal).
            try:
                course_ids = get_user_course_ids(uid)
            except Exception as e:
                print(f"Error leyendo cursos (multimodal, uid={uid}): {e}")
                course_ids = []

            contexto, fuentes_capeo = "", []
            if course_ids and texto:
                try:
                    contexto, fuentes_capeo = buscar_contexto(texto, course_ids)
                except Exception as e:
                    print(f"Error en búsqueda capada (multimodal, uid={uid}): {e}")

            material = contexto or "(Sin material específico de los cursos del alumno.)"
            if texto:
                texto_para_modelo = (
                    "Apóyate en el MATERIAL DE TUS CURSOS (abajo) y en los "
                    "documentos abiertos disponibles para responder. No inventes "
                    "lo que no esté en el material ni en los archivos.\n\n"
                    "=== MATERIAL DE TUS CURSOS ===\n"
                    f"{material}\n"
                    "=== FIN DEL MATERIAL ===\n\n"
                    f"Pregunta del alumno: {texto}"
                )
            else:
                texto_para_modelo = (
                    "Analiza los archivos adjuntos apoyándote en el MATERIAL DE "
                    "TUS CURSOS (abajo) y en los documentos abiertos.\n\n"
                    "=== MATERIAL DE TUS CURSOS ===\n"
                    f"{material}\n"
                    "=== FIN DEL MATERIAL ==="
                )

            partes_envio = [Part.from_text(texto_para_modelo)]

            # Adjuntar TODOS los archivos como Parts independientes
            for archivo in archivos:
                contenido_archivo = await archivo.read()
                tipo_mime = archivo.content_type or "application/octet-stream"
                partes_envio.append(Part.from_data(
                    data=contenido_archivo,
                    mime_type=tipo_mime
                ))

            # Llamada bloqueante (los archivos no streamean bien con grounding).
            # model_multimodal: grounding SÓLO de stores abiertos (TFG + apuntes
            # generales), nunca del store con capeo.
            response = await run_in_threadpool(model_multimodal.generate_content, partes_envio)
            try:
                um = getattr(response, "usage_metadata", None)
                if um and getattr(um, "total_token_count", 0):
                    sumar_tokens(uid, um.total_token_count)
            except Exception as e:
                print(f"Error contando tokens (multimodal, uid={uid}): {e}")

            # Etiqueta legible para el historial
            nombres_str = ", ".join(a.filename for a in archivos)
            user_history = get_user_history(uid)
            user_history.append({
                "role": "user",
                "parts": [{"text": texto + f" [Adjuntos: {nombres_str}]"}]
            })
            bot_reply = response.text
            # Fuentes = capeo (nuestra búsqueda filtrada) + grounding abierto/TFG.
            fuentes_reales = fuentes_capeo + procesar_fuentes(response)
            user_history.append({
                "role": "model",
                "parts": [{"text": bot_reply}]
            })
            return JSONResponse(content={
                "respuesta": bot_reply,
                "fuentes": fuentes_reales
            })

        # --- C. MODO TEXTO — STREAMING NDJSON ---
        print("Procesando MODO TEXTO (Streaming)...")
        return StreamingResponse(
            _stream_text_response(texto, user["uid"]),
            media_type="application/x-ndjson"
        )

    except Exception as e:
        print(f"CRASH en /chat: {e}")
        user_history = chat_history_per_uid.get(user["uid"], [])
        if user_history and user_history[-1]["role"] == "user":
            user_history.pop()
        return JSONResponse(
            status_code=500,
            content={"respuesta": "Lo siento, hubo un error técnico procesando tu solicitud.", "error": str(e)}
        )


def _stream_text_response(texto: str, uid: str):
    """Generador NDJSON que streamea la respuesta de Gemini chunk a chunk,
    CAPADA por los cursos que el alumno ha comprado.

    Flujo del capeo:
      1. course_ids = cursos comprados por el alumno (Firestore).
      2. Vertex AI Search filtrando por esos course_id -> contexto + fuentes.
      3. Se inyecta ese contexto (ya filtrado) en el prompt y responde
         model_capeo, que NO lleva grounding propio -> imposible que use
         material de cursos no comprados.

    Formato de cada línea:
      {"type":"chunk","text":"..."}    - fragmento de texto generado
      {"type":"done","sources":[...]}  - fin del stream + fuentes RAG
      {"type":"error","message":"..."} - error en mitad del stream
    """
    user_history = get_user_history(uid)

    # 0) Tope de consumo diario por alumno (evita grandes consumos / abuso).
    try:
        if tokens_usados_hoy(uid) >= LIMITE_TOKENS_DIA:
            user_history.append({"role": "user", "parts": [{"text": texto}]})
            msg = ("Has alcanzado tu límite de uso por hoy. Vuelve mañana para "
                   "seguir estudiando: es un tope diario para mantener el tutor "
                   "disponible para todos. Disculpa las molestias.")
            user_history.append({"role": "model", "parts": [{"text": msg}]})
            yield json.dumps({"type": "chunk", "text": msg}, ensure_ascii=False) + "\n"
            yield json.dumps({"type": "done", "sources": []}, ensure_ascii=False) + "\n"
            return
    except Exception as e:
        print(f"Error comprobando tope de tokens (uid={uid}): {e}")

    # 1) Cursos comprados (la "llave" del capeo). Cargamos también los NOMBRES
    # para poder decirle al alumno qué cursos tiene / preguntar sobre cuál.
    try:
        cursos_alumno = get_user_cursos(uid)
    except Exception as e:
        print(f"Error leyendo cursos del usuario {uid}: {e}")
        cursos_alumno = []
    course_ids = list(dict.fromkeys(c["id"] for c in cursos_alumno))

    # Sin cursos -> no hay temario que consultar (fail-closed: nunca se busca
    # en todo el corpus sin filtro).
    if not course_ids:
        user_history.append({"role": "user", "parts": [{"text": texto}]})
        msg = ("No encuentro cursos activos asociados a tu cuenta, así que no "
               "puedo consultar el material de ningún curso. Si crees que es un "
               "error, contacta con Medicarama.")
        user_history.append({"role": "model", "parts": [{"text": msg}]})
        yield json.dumps({"type": "chunk", "text": msg}, ensure_ascii=False) + "\n"
        yield json.dumps({"type": "done", "sources": []}, ensure_ascii=False) + "\n"
        return

    # 2) Recuperación filtrada por curso.
    # La query de búsqueda incluye los ÚLTIMOS TURNOS del alumno (no solo el
    # último mensaje): así un follow-up como "hazme un test de 10 preguntas"
    # hereda el tema del turno anterior y no se queda sin contexto.
    msgs_recientes = [
        m["parts"][0]["text"]
        for m in user_history[-6:]
        if m.get("role") == "user" and m.get("parts")
        and m["parts"][0].get("text")
    ]
    query_busqueda = " ".join(msgs_recientes[-2:] + [texto]).strip()
    # Si pide test/examen/resumen del temario, ampliamos page_size para reunir
    # más material (8 fragmentos no dan para un test largo).
    t_low = texto.lower()
    pide_mucho = any(p in t_low for p in (
        "test", "examen", "quiz", "pregunta", "resumen", "resume",
        "temario", "apuntes", "esquema", "repaso",
    ))
    try:
        contexto, fuentes = buscar_contexto(
            query_busqueda, course_ids, k=30 if pide_mucho else 8)
    except Exception as e:
        print(f"Error en búsqueda capada (uid={uid}, cursos={course_ids}): {e}")
        contexto, fuentes = "", []

    # 2b) Aviso "curso sin material": si la búsqueda vino vacía Y NINGUNO de los
    # cursos comprados tiene material en el corpus, el problema no es la pregunta
    # sino que ese curso aún no está cargado. Se lo decimos claro al alumno (si
    # no, ve "no encontré nada" en un curso que pagó y se desquicia).
    if not contexto:
        try:
            hay_material = any(curso_tiene_material(cid) for cid in course_ids)
        except Exception as e:
            print(f"Error comprobando disponibilidad (uid={uid}): {e}")
            hay_material = True  # ante la duda, no avisamos en falso
        if not hay_material:
            nombres = ", ".join(
                f"«{c.get('nombre') or c['id']}»" for c in cursos_alumno
            ) or "tu curso"
            aviso = (
                f"El material de {nombres} todavía no está disponible en el "
                "tutor: lo estamos cargando. Por eso aún no puedo responder sobre "
                "su contenido. En cuanto esté listo podrás consultarlo aquí. Si "
                "crees que es un error, contacta con Medicarama."
            )
            user_history.append({"role": "user", "parts": [{"text": texto}]})
            user_history.append({"role": "model", "parts": [{"text": aviso}]})
            yield json.dumps({"type": "chunk", "text": aviso}, ensure_ascii=False) + "\n"
            yield json.dumps({"type": "done", "sources": []}, ensure_ascii=False) + "\n"
            return

    # 2c) MODO DOCUMENTO COMPLETO: para peticiones de test/temario, los
    # fragmentos no bastan (suelen traer solo índices). Le pasamos a Gemini los
    # PDF ENTEROS del curso. Elegimos el curso por el que domina en los
    # resultados RAG (que ya van por el tema, gracias a la query con historial);
    # si no hay señal y solo tiene un curso, ese.
    pdf_uris = []
    if pide_mucho:
        conteo = {}
        for f in fuentes:
            cid = f.get("course_id")
            if cid:
                conteo[cid] = conteo.get(cid, 0) + 1
        curso_obj = (max(conteo, key=conteo.get) if conteo else
                     (cursos_alumno[0]["id"] if len(cursos_alumno) == 1 else None))
        if curso_obj:
            pdf_uris = pdfs_de_curso(curso_obj)

    # 3) Entrada para el modelo: documento completo (PDFs) o fragmentos inyectados
    if pdf_uris:
        recap = " | ".join(msgs_recientes[-3:]) if msgs_recientes else ""
        ult_bot = ""
        for m in reversed(user_history):
            pl = m.get("parts", [])
            if m.get("role") == "model" and pl and pl[0].get("text"):
                ult_bot = pl[0]["text"][:1500]
                break
        instr = (
            (f"Contexto reciente de la conversación del alumno: {recap}\n\n"
             if recap else "")
            + "Tienes adjuntos los DOCUMENTOS COMPLETOS del curso del alumno. "
            "Trabaja sobre TODO su contenido (no solo los índices o títulos). "
            f"Atiende su petición: {texto}\n"
            "Si pide un número de preguntas, genéralas con calidad y variedad, "
            "cubriendo distintas partes del temario. Para tests: cada pregunta "
            "con opciones A-D y, JUSTO DEBAJO, su solución SIEMPRE entre dobles "
            "barras (spoiler), formato exacto ||Respuesta: C - justificación "
            "breve||. Si no caben todas completas, haz solo las que quepan "
            "ENTERAS y pide al alumno que escriba «continúa» para el resto; "
            "nunca dejes una pregunta o solución a medias. No inventes nada que "
            "no esté en los documentos."
            + (f"\n\nYa generaste antes esto (NO lo repitas, haz preguntas "
               f"NUEVAS y distintas):\n{ult_bot}" if ult_bot else "")
        )
        partes = [Part.from_uri(u, mime_type="application/pdf") for u in pdf_uris]
        partes.append(Part.from_text(instr))
        generation_input = partes
    else:
        material = contexto if contexto else (
            "(Material limitado para esta consulta. Si hace falta, pide al alumno "
            "que concrete el tema; NO afirmes que no tiene material de su curso.)")
        lista_cursos = ", ".join(
            f"«{c.get('nombre') or c['id']}»" for c in cursos_alumno
        ) or "(ninguno)"
        # Si el alumno generó una imagen hace poco, inyectamos su descripción
        # DIRECTAMENTE en el prompt (no dependemos del historial del front). Así
        # "¿qué enfermedad tiene?" se responde concreto y seguro.
        _img = _ultima_imagen.get(uid)
        nota_img = ""
        if _img and (_time.time() - _img.get("ts", 0) < 600):
            nota_img = (
                "CONTEXTO: acabas de generar una ilustración para este alumno. "
                + _img["desc"] + " Si el alumno pregunta '¿qué enfermedad tiene?', "
                "por la imagen o por el órgano que has creado/dibujado, responde "
                "con esa información de forma concreta y NO digas que no puedes "
                "ver imágenes.\n\n"
            )
        texto_aumentado = (
            nota_img
            + f"Estos son los cursos del alumno: {lista_cursos}.\n"
            "- Si te pregunta qué cursos tiene o sobre qué puede preguntar, "
            "enuméraselos.\n"
            "- Si te pide algo genérico (p. ej. «hazme un test») sin indicar tema "
            "ni curso, y no se deduce de la conversación, pregúntale sobre cuál de "
            "sus cursos lo quiere antes de generarlo.\n\n"
            "Responde usando el material de los cursos que aparece abajo, sin "
            "inventar datos que no estén en él. Si el material es escaso, trabaja "
            "con lo que haya y haz lo posible (p. ej. genera menos preguntas pero "
            "de calidad); NO le digas que no tiene material de su curso ni le "
            "pidas que te lo aporte (se selecciona automáticamente).\n\n"
            "=== MATERIAL DE TUS CURSOS ===\n"
            f"{material}\n"
            "=== FIN DEL MATERIAL ===\n\n"
            f"Pregunta del alumno: {texto}"
        )
        contexto_vertex = []
        for m in user_history[-10:]:
            parts_list = m.get("parts", [])
            if parts_list and "text" in parts_list[0]:
                contexto_vertex.append({
                    "role": m["role"],
                    "parts": [{"text": parts_list[0]["text"]}]
                })
        contexto_vertex.append(
            {"role": "user", "parts": [{"text": texto_aumentado}]})
        generation_input = contexto_vertex

    # Guardar en el historial la pregunta ORIGINAL (no la aumentada)
    user_history.append({"role": "user", "parts": [{"text": texto}]})

    full_text = ""
    usage_total = 0
    try:
        response_stream = model_capeo.generate_content(
            generation_input, stream=True)

        for chunk in response_stream:
            chunk_text = ""
            try:
                if hasattr(chunk, "text") and chunk.text:
                    chunk_text = chunk.text
            except Exception:
                # Algunos chunks (p.ej. solo metadata) no tienen texto accesible
                pass
            try:
                um = getattr(chunk, "usage_metadata", None)
                if um and getattr(um, "total_token_count", 0):
                    usage_total = um.total_token_count  # acumulado: vale el último
            except Exception:
                pass

            if chunk_text:
                full_text += chunk_text
                yield json.dumps(
                    {"type": "chunk", "text": chunk_text},
                    ensure_ascii=False
                ) + "\n"

        user_history.append({
            "role": "model",
            "parts": [{"text": full_text}]
        })
        if usage_total:
            sumar_tokens(uid, usage_total)

        # Las fuentes vienen de nuestra búsqueda capada, no del grounding.
        yield json.dumps(
            {"type": "done", "sources": fuentes},
            ensure_ascii=False
        ) + "\n"

    except Exception as e:
        print(f"Stream error: {e}")
        # Rollback del mensaje de usuario al fallar
        if user_history and user_history[-1]["role"] == "user":
            user_history.pop()
        yield json.dumps(
            {"type": "error", "message": "Error generando respuesta. Reintenta."},
            ensure_ascii=False
        ) + "\n"

@app.post("/generate_pdf_file")
async def generate_pdf_file(
    data: MemoryUpdate,
    user: dict = Depends(verify_firebase_token)
):
    # Este endpoint recibe JSON, no Form, así que usa Pydantic (data: MemoryUpdate)
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

        # Reformateo puro del chat (ya capado) a apuntes: sin grounding, para no
        # arrastrar material de otros cursos a los apuntes generados.
        gemini_response = model_capeo.generate_content(prompt)
        raw_text = gemini_response.text

        pdf_bytes = crear_pdf_binario(raw_text)
        return Response(content=pdf_bytes, media_type="application/pdf")

    except Exception as e:
        print(f"Error PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update_memory")
async def update_memory(
    request: Request,
    user: dict = Depends(verify_firebase_token)
):
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

        # Sobrescribe el historial del USUARIO concreto, no el global compartido.
        chat_history_per_uid[user["uid"]] = formatted_history
        return {"status": "ok"}
    except Exception as e:
        print(f"Error memoria: {e}")
        return {"status": "error", "detail": str(e)}