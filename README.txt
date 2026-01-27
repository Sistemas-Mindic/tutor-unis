# UniBot Medicarama - Tutor IA Universitario

Este proyecto es un asistente virtual inteligente diseñado para estudiantes de ciencias de la salud. Utiliza **Google Gemini (Vertex AI)** para razonar y **FastAPI** como servidor web.

### Funcionalidades
* Chat Educativo: Responde dudas médicas basándose estrictamente en documentos oficiales (RAG).
* Multimodal: Permite subir imágenes o PDFs para que la IA los analice.
* Memoria: Mantiene el hilo de la conversación.
* Generación de Apuntes: Crea resúmenes en PDF descargables.

---

## 1. Estructura del Proyecto

Tu carpeta debe quedar organizada exactamente así:


PROYECTO/
│
├── app/                    # LÓGICA DEL BACKEND
│   ├── __init__.py         # Archivo vacío
│   ├── main.py             # Servidor y Endpoints
│   ├── services.py         # Conexión Gemini y PDF
│   ├── models.py           # Modelos de datos
│   └── config.py           # Configuración y Prompts
│
├── static/                 # FRONTEND
│   ├── css/                # style.css
│   ├── js/                 # main.js
│   └── images/             # logo.png, micro.png...
│
├── index.html              # Web principal
├── requirements.txt        # Librerías (ver paso 2)
└── README.md               # Este archivo


INICIACIÓN Y EJECUCIÓN

Paso B: Crear Entorno Virtual 
Si hay uno borralo con 
rm -rf venv
Abre tu terminal en la carpeta del proyecto y ejecuta:

En Windows:

python -m venv venv
.\venv\Scripts\activate


En Mac / Linux:

python3 -m venv venv
source venv/bin/activate




Paso C: Instalar Librerías
Una vez creado el entorno y el archivo requirements.txt, ejecuta:

pip install -r requirements.txt



Paso D: Autenticación Google Cloud
Es obligatorio para que la IA (Gemini) funcione. Necesitas tener instalado el Google Cloud CLI.

gcloud auth application-default login

(Se abrirá el navegador. Inicia sesión con el correo autorizado en el proyecto tutor-unis).



 3. Ejecutar el Servidor

Desde la carpeta raíz del proyecto, lanza el comando:

uvicorn app.main:app --reload