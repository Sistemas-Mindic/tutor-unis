# -*- coding: utf-8 -*-
"""Lista los usuarios de Firestore ordenados por createdAt (más nuevos primero)
y muestra si tienen `cursos`. Sirve para verificar que un registro NUEVO trae
las matrículas (capeo) desde Zoho.

Uso:  python3 check_new_user.py
"""
import firebase_admin
from firebase_admin import firestore
from app.config import PROJECT_ID

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={"projectId": PROJECT_ID})


def _key(d):
    c = d.get("createdAt")
    # createdAt puede ser timestamp de Firestore (ordenable) o None
    return getattr(c, "timestamp", lambda: 0)() if c is not None else 0


def main():
    db = firestore.client()
    users = []
    for s in db.collection("users").stream():
        d = s.to_dict() or {}
        users.append((s.id, d))
    users.sort(key=lambda t: _key(t[1]), reverse=True)

    print(f"TOTAL usuarios: {len(users)}")
    con_cursos = [u for u in users if (u[1].get("cursos"))]
    print(f"con `cursos` poblado: {len(con_cursos)}")
    print("\n=== 6 MÁS RECIENTES ===")
    for uid, d in users[:6]:
        cursos = d.get("cursos")
        if cursos:
            ids = [str(c.get("id")) for c in cursos if isinstance(c, dict)]
            cur = f"✅ cursos={ids}"
        else:
            cur = "❌ sin cursos"
        print(f"  {d.get('createdAt')}  {d.get('email','?'):35s} "
              f"src={d.get('source','?'):20s} {cur}")
        print(f"     uid={uid}  campos={sorted(d.keys())}")

    if con_cursos:
        print("\n>>> USUARIOS CON CURSOS (capeo operativo para ellos):")
        for uid, d in con_cursos:
            ids = [str(c.get("id")) for c in d.get("cursos") if isinstance(c, dict)]
            print(f"  - {d.get('email','?')}  uid={uid}  cursos={ids}")


if __name__ == "__main__":
    main()
