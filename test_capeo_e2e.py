# -*- coding: utf-8 -*-
"""Smoke test end-to-end del capeo por curso (sin levantar uvicorn).

1. Inicializa Firebase (ADC).
2. Busca un usuario REAL con cursos en Firestore.
3. Comprueba get_user_course_ids -> buscar_contexto (filtro) por separado.
4. Ejecuta el generador _stream_text_response completo y vuelca el NDJSON.

Uso:  python3 test_capeo_e2e.py ["pregunta opcional"]
"""
import sys
import json

import firebase_admin
from firebase_admin import firestore

from app.config import PROJECT_ID

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": PROJECT_ID})


def find_user_with_courses(limit_scan=400):
    db = firestore.client()
    for snap in db.collection("users").limit(limit_scan).stream():
        d = snap.to_dict() or {}
        cursos = d.get("cursos") or []
        ids = [str(c.get("id")).strip() for c in cursos
               if isinstance(c, dict) and c.get("id") not in (None, "")]
        if ids:
            return snap.id, ids, d.get("email", "?")
    return None, [], None


TEST_UID = "ZZ_TEST_CAPEO_DELETE_ME"
TEST_COURSES = [{"id": "3287", "title": "Cuidados Paliativos"},
                {"id": "4139", "title": "Antibioterapia Básica"}]


def seed_test_user():
    db = firestore.client()
    db.collection("users").document(TEST_UID).set({
        "email": "test-capeo@example.com",
        "source": "test_capeo_e2e",
        "cursos": TEST_COURSES,
    })
    print(f"[seed] usuario temporal {TEST_UID} con cursos "
          f"{[c['id'] for c in TEST_COURSES]}")


def delete_test_user():
    db = firestore.client()
    db.collection("users").document(TEST_UID).delete()
    print(f"[cleanup] borrado usuario temporal {TEST_UID}")


def main():
    pregunta = sys.argv[1] if len(sys.argv) > 1 else "¿Qué es el dolor neuropático?"

    uid, ids, email = find_user_with_courses()
    if not uid:
        print("NO hay ningún usuario REAL con cursos en Firestore "
              "(el capeo fail-closea para todos ellos).")
        print("Sembrando un usuario de prueba para validar el flujo e2e...\n")
        seed_test_user()
        uid, ids, email = TEST_UID, [c["id"] for c in TEST_COURSES], "test"
    print(f"\nUsuario de prueba: uid={uid}  email={email}")
    print(f"  course_ids comprados: {ids}\n")
    try:
        _run(pregunta, uid)
    finally:
        if uid == TEST_UID:
            delete_test_user()


def _run(pregunta, uid):

    # --- Componentes por separado ---
    from app.retrieval import get_user_course_ids, buscar_contexto
    ids2 = get_user_course_ids(uid)
    print(f"get_user_course_ids -> {ids2}")
    ctx, fuentes = buscar_contexto(pregunta, ids2)
    print(f"buscar_contexto -> {len(fuentes)} fuentes, contexto={len(ctx)} car.")
    for f in fuentes[:5]:
        print(f"   - [{f.get('course_id')}] {str(f.get('titulo'))[:55]}")
    print()

    # --- Generador completo (lo que sirve /chat) ---
    print(f"=== _stream_text_response (pregunta={pregunta!r}) ===")
    from app.main import _stream_text_response
    full = ""
    sources = None
    for line in _stream_text_response(pregunta, uid):
        obj = json.loads(line)
        t = obj.get("type")
        if t == "chunk":
            full += obj["text"]
        elif t == "done":
            sources = obj.get("sources")
        elif t == "error":
            print("  ERROR:", obj.get("message"))
    print("\n--- RESPUESTA (primeros 900 car.) ---")
    print(full[:900])
    print(f"\n--- sources devueltas: {len(sources or [])} ---")
    for s in (sources or [])[:5]:
        print(f"   - [{s.get('course_id')}] {str(s.get('titulo'))[:55]}")


if __name__ == "__main__":
    main()
