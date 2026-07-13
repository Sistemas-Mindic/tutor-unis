# Tutor Virtual de Medicarama (UniBot / Tutor-unis)

Asistente educativo con IA para los alumnos de **Medicarama**. Es un chatbot RAG
sobre **Gemini (Vertex AI)** que responde **usando solo el material de los cursos
que cada alumno ha comprado** (el "capeo"), genera tests autoevaluables, analiza
documentos e imágenes que sube el alumno, crea ilustraciones médicas y exporta
apuntes en PDF.

Está desplegado en producción sobre **Cloud Run** (`unibot-medicarama`,
`us-central1`, proyecto `tutor-unis`).

> ### 📘 Documentación técnica completa
> **`docs/Documentacion_Tecnica_Tutor-unis.pdf`** — arquitectura, capeo,
> endpoints, seguridad, despliegue, evaluación y deuda técnica.
> **Es la guía de referencia; este README es solo el arranque rápido.**

---

## ¿Retomas el proyecto? Empieza por aquí

Este repositorio es **solo la aplicación web** (backend + frontend). El sistema
completo depende además de servicios de Google Cloud y de otra pieza de código,
así que **un clon/zip por sí solo NO basta para ejecutarlo**. Necesitas:

### ✅ Checklist de accesos (pídeselos al responsable)

- [ ] **Acceso al proyecto de Google Cloud `tutor-unis`** (IAM). Roles: *Vertex
      AI User*, *Discovery Engine* (search), *Firestore*, *Storage* y *Cloud Run*
      (+ *Service Account Token Creator* para las URLs firmadas). **Sin esto la
      app arranca pero falla con errores de permisos** — es lo más importante.
- [ ] El fichero **`.env`** (no está en el repo por seguridad; los valores están
      en el PDF, sección *6. Configuración y variables de entorno*).
- [ ] La carpeta **`tutor-unis-functions`** — las Cloud Functions del alta de
      alumnos (`registerNewUser`, `recordActiveSession`; Zoho → Firestore). **El
      capeo depende de ellas** y no viven en este repo.
- [ ] Acceso a este repositorio para clonar y hacer `push`.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + Uvicorn (Python 3.10) |
| IA | Gemini 2.5 Flash + Imagen 3.0 (Vertex AI) |
| RAG / buscador | Vertex AI Search — engine `medicarama-search` |
| Auth | Firebase Authentication (email + verificación) |
| Base de datos | Cloud Firestore (colección `users`) |
| Ficheros | Cloud Storage (bucket privado + URLs firmadas) |
| Frontend | HTML + CSS + JavaScript vanilla |
| Despliegue | Cloud Run (`unibot-medicarama`, us-central1) |

## Estructura

```
app/                Backend
  main.py             Endpoints, 3 modos de /chat, streaming, generación de imagen
  services.py         Init Vertex AI, los 3 modelos de IA, generación de PDF
  retrieval.py        CAPEO por curso (Firestore + Vertex AI Search filtrado)
  config.py           .env, system prompt, filtros de seguridad, límites
  models.py           Modelos Pydantic
static/             Frontend (css/, js/auth.js, js/main.js, images/)
index.html          Shell de la web (login + chat)
docs/               Documentación técnica (PDF)  <-- LÉELA
evaluacion/         Batería de evaluación (harness + CSVs + resultados)
Dockerfile          Imagen de contenedor para Cloud Run
```

## Arranque en local

```bash
# 1. Entorno virtual + dependencias
python3 -m venv venv
source venv/bin/activate            # Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# 2. Crea el fichero .env en la raíz (valores en el PDF de docs/, sección 6)

# 3. Autenticación con Google Cloud (abre el navegador; usa un correo con acceso
#    al proyecto tutor-unis)
gcloud auth application-default login

# 4. Arrancar el servidor de desarrollo
uvicorn app.main:app --reload       # -> http://127.0.0.1:8000
```

> **Nota sobre la autenticación:** la organización fuerza reautenticaciones
> frecuentes. Si ves `Reauthentication is needed`, repite el paso 3. No es un bug.

## Desplegar (Cloud Run)

```bash
gcloud run deploy unibot-medicarama \
  --source . --region us-central1 --project tutor-unis
```

## Comprobaciones rápidas (smoke tests)

```bash
python3 test_capeo_e2e.py "qué es el dolor neuropático"   # capeo end-to-end
python3 test_multimodal_capeo.py                           # path multimodal capado
python3 check_new_user.py                                  # altas Zoho -> Firestore
python3 -m app.retrieval "dolor neuropático" 3287 4139     # búsqueda RAG filtrada
```

---

*Para todo lo demás — por qué el capeo es fail-closed, cómo funciona la
generación de imagen con contexto, la evaluación (OE6), el despliegue detallado o
la resolución de problemas — consulta el **PDF de `docs/`**.*
