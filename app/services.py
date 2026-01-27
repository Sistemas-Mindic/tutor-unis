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
    PROJECT_ID, REGION, DATA_STORE_ID, DATA_STORE_ID_TFG,
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

# --- MODELO ---
model = GenerativeModel(
    "gemini-2.5-flash",
    tools=[herramienta_temario, herramienta_tfg],
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
        print(f"⚠️ Error procesando fuentes: {e}")
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