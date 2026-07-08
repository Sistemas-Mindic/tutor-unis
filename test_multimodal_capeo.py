# -*- coding: utf-8 -*-
"""Smoke test del path MULTIMODAL capado (imagen + material de cursos inyectado).

Reproduce lo que hace /chat en MODO MULTIMODAL sin levantar uvicorn:
  1. Siembra usuario de prueba con cursos 3287/4139.
  2. buscar_contexto (filtrado) -> material capado.
  3. Construye Part de texto (con material inyectado) + Part de imagen.
  4. model_multimodal.generate_content (grounding SÓLO de stores abiertos).
  5. Comprueba respuesta + fuentes (capeo + grounding) y borra el usuario.
"""
import io
import json

import firebase_admin
from firebase_admin import firestore
from vertexai.generative_models import Part

from app.config import PROJECT_ID

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": PROJECT_ID})

TEST_UID = "ZZ_TEST_MM_DELETE_ME"
TEST_COURSES = [{"id": "3287", "title": "Cuidados Paliativos"},
                {"id": "4139", "title": "Antibioterapia Básica"}]


def make_image_bytes():
    """Imagen pequeña con texto legible para forzar lectura multimodal."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (480, 140), "white")
        d = ImageDraw.Draw(img)
        d.text((12, 20), "Paciente con dolor neuropatico.", fill="black")
        d.text((12, 50), "Parestesias y alodinia en MMII.", fill="black")
        d.text((12, 80), "Pregunta: tratamiento recomendado?", fill="black")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue(), "image/png"
    except Exception as e:
        print(f"(PIL no disponible: {e}; uso PNG solido)")
        # PNG 1x1 valido de respaldo
        import base64
        b = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
        return b, "image/png"


def main():
    db = firestore.client()
    db.collection("users").document(TEST_UID).set({
        "email": "test-mm@example.com", "source": "test_mm", "cursos": TEST_COURSES})
    print(f"[seed] {TEST_UID} cursos={[c['id'] for c in TEST_COURSES]}")
    try:
        from app.retrieval import get_user_course_ids, buscar_contexto
        from app.services import model_multimodal, procesar_fuentes

        texto = "Según la imagen, ¿qué tratamiento del dolor neuropático aplico?"
        course_ids = get_user_course_ids(TEST_UID)
        contexto, fuentes_capeo = buscar_contexto(texto, course_ids)
        print(f"course_ids={course_ids}  fuentes_capeo={len(fuentes_capeo)} "
              f"contexto={len(contexto)} car.")

        material = contexto or "(Sin material.)"
        texto_para_modelo = (
            "Apóyate en el MATERIAL DE TUS CURSOS (abajo) y los documentos "
            "abiertos. No inventes.\n\n=== MATERIAL DE TUS CURSOS ===\n"
            f"{material}\n=== FIN DEL MATERIAL ===\n\nPregunta del alumno: {texto}")

        img_bytes, mime = make_image_bytes()
        partes = [Part.from_text(texto_para_modelo),
                  Part.from_data(data=img_bytes, mime_type=mime)]

        print("Llamando model_multimodal.generate_content (imagen + grounding)...")
        resp = model_multimodal.generate_content(partes)
        fuentes = fuentes_capeo + procesar_fuentes(resp)

        print("\n--- RESPUESTA (primeros 800 car.) ---")
        print(resp.text[:800])
        print(f"\n--- fuentes totales: {len(fuentes)} (capeo={len(fuentes_capeo)}) ---")
        cids = sorted({f.get('course_id') for f in fuentes if f.get('course_id')})
        print(f"course_ids en fuentes: {cids}  (debe ser subconjunto de {course_ids})")
        for f in fuentes[:6]:
            print(f"   - [{f.get('course_id')}] {str(f.get('titulo'))[:55]}")
    finally:
        db.collection("users").document(TEST_UID).delete()
        print(f"\n[cleanup] borrado {TEST_UID}")


if __name__ == "__main__":
    main()
