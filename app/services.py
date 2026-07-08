# app/services.py
import vertexai
# IMPORTANTE: Usamos .preview exactamente como en tu original para evitar conflictos
from vertexai.preview.generative_models import (
    GenerativeModel, Tool, grounding, Part
)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_JUSTIFY
import io
import os

from .config import (
    PROJECT_ID, REGION, DATA_STORE_ID, DATA_STORE_ID_TFG, OPEN_DATA_STORE_ID,
    system_instruction, filtros_seguridad, configuracion_tutor
)

# --- INICIALIZACIÓN ---
print(f"🔌 Conectando a Vertex AI en {PROJECT_ID}...")
vertexai.init(project=PROJECT_ID, location=REGION)

# --- HERRAMIENTAS ---
herramienta_temario = Tool.from_retrieval(
    retrieval=grounding.Retrieval(
        source=grounding.VertexAISearch(
            datastore=DATA_STORE_ID,
            project=PROJECT_ID,
            location="global",
        )
    )
)

herramienta_tfg = Tool.from_retrieval(
    retrieval=grounding.Retrieval(
        source=grounding.VertexAISearch(
            datastore=DATA_STORE_ID_TFG,
            project=PROJECT_ID,
            location="global",
        )
    )
)

# Herramienta de DOCUMENTOS ABIERTOS (apuntes generales, todos los alumnos).
# Sólo se construye si OPEN_DATA_STORE_ID está configurado (se suben los abiertos
# más tarde). Al vivir en su PROPIO data store SIN capar, el grounding clásico
# vale: no hay capeo que romper porque son abiertos para todo el mundo.
herramienta_abierta = None
if OPEN_DATA_STORE_ID:
    herramienta_abierta = Tool.from_retrieval(
        retrieval=grounding.Retrieval(
            source=grounding.VertexAISearch(
                datastore=OPEN_DATA_STORE_ID,
                project=PROJECT_ID,
                location="global",
            )
        )
    )
    print(f"📂 Documentos abiertos activos: {OPEN_DATA_STORE_ID}")
else:
    print("📂 Documentos abiertos: (sin configurar OPEN_DATA_STORE_ID todavía)")

# Stores ABIERTOS para grounding (nunca el de capeo): TFG + apuntes generales.
herramientas_abiertas = [herramienta_tfg]
if herramienta_abierta is not None:
    herramientas_abiertas.append(herramienta_abierta)

# --- MODELO LEGACY (NO usar en paths capados) ---
# Lleva grounding del data store ANTIGUO (DATA_STORE_ID), que mezcla todos los
# cursos sin filtro -> FILTRA DE MÁS. Se mantiene sólo por compatibilidad; los
# endpoints capados usan model_capeo / model_multimodal.
model = GenerativeModel(
    "gemini-2.5-flash",
    tools=[herramienta_temario, herramienta_tfg],
    system_instruction=system_instruction,
    safety_settings=filtros_seguridad,
    generation_config=configuracion_tutor
)

# --- MODELO PARA EL FLUJO CAPADO POR CURSO ---
# SIN herramientas de grounding: el contexto del temario se le inyecta ya
# filtrado por los cursos que el alumno ha comprado (app/retrieval.py busca en
# Vertex con filter=course_id: ANY(...)). Al no llevar la herramienta de
# temario, el modelo NO puede recuperar por su cuenta material de cursos no
# comprados -> el capeo es estricto (fail-closed).
model_capeo = GenerativeModel(
    "gemini-2.5-flash",
    system_instruction=system_instruction,
    safety_settings=filtros_seguridad,
    generation_config=configuracion_tutor
)

# --- MODELO MULTIMODAL CAPADO (path con archivos/imágenes) ---
# El material de los cursos COMPRADOS se inyecta ya filtrado por
# app/retrieval.buscar_contexto -> por eso este modelo NO lleva grounding del
# data store con capeo (sería un agujero: la herramienta no filtra). Sí lleva
# grounding de los stores ABIERTOS (TFG + apuntes generales), que son para todos
# los alumnos. Resultado: el alumno ve las imágenes + el material de SUS cursos
# (inyectado) + los documentos abiertos (grounding), nunca cursos no comprados.
model_multimodal = GenerativeModel(
    "gemini-2.5-flash",
    tools=herramientas_abiertas,
    system_instruction=system_instruction,
    safety_settings=filtros_seguridad,
    generation_config=configuracion_tutor
)

# --- FUNCIONES AUXILIARES ---

def procesar_fuentes(response):
    lista_fuentes = []
    try:
        if response.candidates and response.candidates[0].grounding_metadata:
            metadata = response.candidates[0].grounding_metadata
            for chunk in metadata.grounding_chunks:
                if chunk.retrieved_context:
                    rc = chunk.retrieved_context
                    titulo = rc.title
                    uri = rc.uri
                    
                    pagina = None
                    if hasattr(rc, 'page_identifier'):
                        pagina = rc.page_identifier
                    elif hasattr(rc, 'metadata') and rc.metadata:
                        pagina = rc.metadata.get('page_identifier')

                    if titulo and uri:
                        lista_fuentes.append({
                            "titulo": titulo, 
                            "url": uri,
                            "pagina": pagina 
                        })
    except Exception as e:
        print(f"Error procesando fuentes: {e}")
    return lista_fuentes

def crear_pdf_binario(texto_contenido):
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=A4,
        rightMargin=72, leftMargin=72, 
        topMargin=72, bottomMargin=18
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Justify', alignment=TA_JUSTIFY, leading=14, fontSize=11))
    styles.add(ParagraphStyle(name='Header1', parent=styles['Heading1'], fontSize=16, textColor=colors.darkblue, spaceAfter=10, spaceBefore=15))
    styles.add(ParagraphStyle(name='Header2', parent=styles['Heading2'], fontSize=13, textColor=colors.darkgray, spaceBefore=10))
    
    story = []
    
    # Logo (si existe en static/images)
    logo_path = "static/images/logo.png"
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=50, height=50)
        logo_img.hAlign = 'LEFT'
        story.append(logo_img)
        story.append(Spacer(1, 10))

    story.append(Paragraph("Apuntes de Estudio - Medicarama AI", styles["Title"]))
    story.append(Spacer(1, 12))

    lines = texto_contenido.split('\n')
    for line in lines:
        line = line.strip()
        if not line: continue
        
        if line.startswith('# '):
            story.append(Paragraph(line.replace('# ', '').replace('*', ''), styles["Header1"]))
        elif line.startswith('## '):
            story.append(Paragraph(line.replace('## ', '').replace('*', ''), styles["Header2"]))
        elif line.startswith('- ') or line.startswith('* '):
            story.append(Paragraph("• " + line[2:].replace('*', ''), styles["Justify"]))
        else:
            story.append(Paragraph(line.replace('*', ''), styles["Justify"]))
        
        story.append(Spacer(1, 6))

    doc.build(story)
    return pdf_buffer.getvalue()