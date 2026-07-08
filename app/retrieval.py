# app/retrieval.py
"""Recuperación RAG con CAPEO por curso.

Pieza central del "sistema que clasifica por cursos comprados":

  1. get_user_course_ids(uid)  -> course_id que el alumno compró (Firestore:
                                  users/{uid}.cursos[].id, escritos por la
                                  Cloud Function registerNewUser desde Zoho).
  2. buscar_contexto(q, ids)   -> busca en Vertex AI Search filtrando por esos
                                  course_id y devuelve (contexto, fuentes).

El capeo lo hace el parámetro `filter` de la búsqueda
(`course_id: ANY("3287","4139")`). Sólo funciona porque el data store tiene
course_id marcado INDEXABLE en su schema (ver ingestar_vertex.py). Un alumno
NUNCA recupera material de un curso que no ha comprado: si pidiéramos sin
filtro, Vertex devolvería de todo el corpus.

Se invoca desde main.py (paths de texto y multimodal): el contexto recuperado
aquí se INYECTA en el prompt del modelo capado (model_capeo, SIN grounding), de
modo que el modelo nunca puede recuperar por su cuenta material no comprado.
"""
import datetime
import os
import sys
import time
from typing import List, Tuple

import google.auth
from google.auth.transport import requests as ga_requests
from google.cloud import discoveryengine_v1 as de
from google.cloud import storage
from google.protobuf.json_format import MessageToDict

PROJECT = os.getenv("PROJECT_ID", "tutor-unis")
LOCATION = os.getenv("DATA_STORE_LOCATION", "global")
DATA_STORE_ID = os.getenv("DATA_STORE_ID", "medicarama-corpus-capeo")
# Las extractive answers son una feature de Enterprise edition y SÓLO están
# disponibles a través del serving config del ENGINE (app), no del data store
# pelado. El engine medicarama-search se creó con SEARCH_TIER_ENTERPRISE y
# apunta al data store con capeo (ver ingestar_vertex.py / paso engine).
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID", "medicarama-search")

_SERVING = (
    f"projects/{PROJECT}/locations/{LOCATION}/collections/default_collection/"
    f"engines/{SEARCH_ENGINE_ID}/servingConfigs/default_search"
)

_client = None
_storage_client = None
_signer_creds = None


def _search_client():
    global _client
    if _client is None:
        _client = de.SearchServiceClient()
    return _client


def _gcs():
    global _storage_client
    if _storage_client is None:
        _storage_client = storage.Client(project=PROJECT)
    return _storage_client


def _signing_credentials():
    """ADC del runtime. En Cloud Run son las credenciales de la service account
    vía metadata server. Tras el primer refresh queda relleno
    `service_account_email`, que es lo que permite firmar por IAM signBlob SIN
    fichero de clave (el SA necesita rol Token Creator sobre sí mismo)."""
    global _signer_creds
    if _signer_creds is None:
        _signer_creds, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
    if not _signer_creds.valid:
        _signer_creds.refresh(ga_requests.Request())
    return _signer_creds


def firmar_url(gs_uri: str, minutos: int = 15) -> str:
    """Convierte gs://bucket/obj en una URL HTTPS firmada V4 (temporal).

    El bucket sigue PRIVADO (Public Access Prevention activado): la firma la
    hace el SA de Cloud Run, no se expone el objeto al público. Si algo falla
    (p. ej. sin ADC en local), devuelve el gs:// original para no romper la
    respuesta (el front lo convertirá a https aunque no llegue a abrir)."""
    if not gs_uri or not gs_uri.startswith("gs://"):
        return gs_uri
    try:
        bucket_name, _, blob_name = gs_uri[5:].partition("/")
        if not blob_name:
            return gs_uri
        creds = _signing_credentials()
        blob = _gcs().bucket(bucket_name).blob(blob_name)
        return blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(minutes=minutos),
            method="GET",
            service_account_email=getattr(creds, "service_account_email", None),
            access_token=getattr(creds, "token", None),
        )
    except Exception as e:  # noqa: BLE001
        print(f"⚠️ No se pudo firmar {gs_uri}: {e}")
        return gs_uri


def get_user_cursos(uid: str) -> List[dict]:
    """Lista cruda de cursos del alumno: [{'nombre','id'}, ...] desde Firestore.

    Lista vacía si el usuario no existe o no tiene cursos. Import perezoso de
    firestore para no acoplar el módulo a que Firebase esté inicializado al
    importarlo (lo está en main.py)."""
    from firebase_admin import firestore
    db = firestore.client()
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        return []
    cursos = (snap.to_dict() or {}).get("cursos", []) or []
    out = []
    for c in cursos:
        if not isinstance(c, dict):
            continue
        cid = c.get("id")
        if cid is None or not str(cid).strip():
            continue
        out.append({"nombre": c.get("nombre"), "id": str(cid).strip()})
    return out


def get_user_course_ids(uid: str) -> List[str]:
    """course_id (string) que el alumno tiene comprados (dedup, orden estable)."""
    ids = [c["id"] for c in get_user_cursos(uid)]
    return list(dict.fromkeys(ids))


def _hoy_utc() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")


def tokens_usados_hoy(uid: str) -> int:
    """Tokens consumidos HOY (UTC) por el alumno. 0 si es otro día o no hay dato."""
    from firebase_admin import firestore
    db = firestore.client()
    snap = db.collection("users").document(uid).get()
    d = (snap.to_dict() or {}) if snap.exists else {}
    if d.get("tokenDay") == _hoy_utc():
        return int(d.get("tokensUsed", 0) or 0)
    return 0


def sumar_tokens(uid: str, n: int) -> None:
    """Suma n tokens al contador diario del alumno (reinicia si cambió el día).
    Transaccional para no perder cuentas con peticiones concurrentes."""
    if n <= 0:
        return
    from firebase_admin import firestore
    db = firestore.client()
    ref = db.collection("users").document(uid)
    hoy = _hoy_utc()

    @firestore.transactional
    def _tx(tx):
        snap = ref.get(transaction=tx)
        d = (snap.to_dict() or {}) if snap.exists else {}
        base = int(d.get("tokensUsed", 0) or 0) if d.get("tokenDay") == hoy else 0
        tx.set(ref, {"tokenDay": hoy, "tokensUsed": base + n}, merge=True)

    try:
        _tx(db.transaction())
    except Exception as e:  # noqa: BLE001
        print(f"⚠️ No se pudieron sumar tokens de {uid}: {e}")


def _filter_expr(course_ids: List[str]) -> str:
    quoted = ",".join(f'"{c}"' for c in course_ids)
    return f"course_id: ANY({quoted})"


# Cache de "¿este curso tiene material en el corpus?" (la pertenencia al corpus
# casi nunca cambia: solo cuando un admin ingesta). TTL 1h para no sondear en
# cada mensaje. {course_id: (bool, epoch)}.
_material_cache = {}
_MATERIAL_TTL = 3600


def curso_tiene_material(course_id: str) -> bool:
    """True si el corpus tiene AL MENOS un documento etiquetado con ese course_id.

    Sirve para distinguir "curso comprado pero sin material cargado todavía" de
    "no encontré nada para esta pregunta concreta". Ante cualquier error de la
    API devuelve True (fail-open): preferimos NO dar un falso aviso de "curso no
    disponible" si la comprobación falla."""
    now = time.time()
    hit = _material_cache.get(course_id)
    if hit and now - hit[1] < _MATERIAL_TTL:
        return hit[0]
    try:
        req = de.SearchRequest(
            serving_config=_SERVING,
            query="contenido del curso tema introduccion",  # genérica
            filter=_filter_expr([course_id]),
            page_size=1,
        )
        resp = _search_client().search(req)
        tiene = any(True for _ in resp.results)
    except Exception as e:  # noqa: BLE001
        print(f"⚠️ No se pudo comprobar material de {course_id}: {e}")
        tiene = True
    _material_cache[course_id] = (tiene, now)
    return tiene


def pdfs_de_curso(course_id: str, max_pdfs: int = 12) -> List[str]:
    """URIs gs:// de los PDFs (documentos) de un curso, para pasárselos COMPLETOS
    al modelo (modo "documento completo": tests/temario, donde los fragmentos no
    bastan). Respeta el capeo: filtra por course_id. Cada documento del data store
    es un PDF, así que sus `link` son los PDFs del curso."""
    try:
        req = de.SearchRequest(
            serving_config=_SERVING,
            query="contenido temario documentacion",  # genérica, alto recall
            filter=_filter_expr([course_id]),
            page_size=max_pdfs,
        )
        resp = _search_client().search(req)
        uris = []
        for r in resp.results:
            d = MessageToDict(r.document._pb, preserving_proto_field_name=True)
            dsd = d.get("derived_struct_data", {}) or {}
            link = dsd.get("link", "")
            if link.startswith("gs://") and link not in uris:
                uris.append(link)
        return uris
    except Exception as e:  # noqa: BLE001
        print(f"⚠️ No se pudieron listar PDFs de {course_id}: {e}")
        return []


def buscar_contexto(
    pregunta: str, course_ids: List[str], k: int = 8,
) -> Tuple[str, list]:
    """Devuelve (contexto_texto, fuentes[]) restringido a course_ids.

    course_ids vacío -> ("", []): un alumno sin cursos no tiene temario que
    consultar (fail-closed: jamás se busca en todo el corpus sin filtro).
    """
    if not course_ids:
        return "", []

    CSS = de.SearchRequest.ContentSearchSpec
    spec = CSS(
        extractive_content_spec=CSS.ExtractiveContentSpec(
            max_extractive_answer_count=2,
        ),
        snippet_spec=CSS.SnippetSpec(return_snippet=True),
    )
    req = de.SearchRequest(
        serving_config=_SERVING,
        query=pregunta,
        filter=_filter_expr(course_ids),
        page_size=k,
        content_search_spec=spec,
    )
    resp = _search_client().search(req)

    bloques, fuentes = [], []
    _url_cache = {}  # firma cada PDF una sola vez por consulta
    for r in resp.results:
        d = MessageToDict(r.document._pb, preserving_proto_field_name=True)
        sd = d.get("struct_data", {}) or {}
        dsd = d.get("derived_struct_data", {}) or {}

        titulo = sd.get("course_title") or sd.get("filename") or d.get("id", "")
        uri = dsd.get("link", "")

        textos = []
        pagina = None
        for ea in dsd.get("extractive_answers", []) or []:
            t = ea.get("content")
            if t:
                textos.append(t)
            # El nº de página viene en el extractive answer (clave camelCase
            # "pageNumber"; vía MessageToDict puede llegar como float). Nos
            # quedamos con el del primer fragmento que lo traiga.
            if pagina is None:
                p = ea.get("pageNumber", ea.get("page_number"))
                if p is not None:
                    try:
                        pagina = int(float(p))
                    except (ValueError, TypeError):
                        pagina = None
        if not textos:
            for sn in dsd.get("snippets", []) or []:
                t = sn.get("snippet")
                if t:
                    textos.append(t)
        cuerpo = " ".join(textos).strip()
        if not cuerpo:
            continue

        if uri:
            if uri not in _url_cache:
                _url_cache[uri] = firmar_url(uri)
            url_final = _url_cache[uri]
        else:
            url_final = uri

        # Solo el CONTENIDO en el texto inyectado: la fuente NO va aquí (el
        # modelo la copiaba en su respuesta). Las fuentes se muestran aparte, al
        # final del mensaje, desde la lista `fuentes` de abajo.
        bloques.append(cuerpo)
        fuentes.append({
            "titulo": titulo,
            "url": url_final,
            "course_id": sd.get("course_id"),
            "pagina": pagina,
        })

    return "\n\n".join(bloques), fuentes


# Smoke test en vivo (tras auth + ingesta):
#   python3 -m app.retrieval "dolor neuropático" 3287 4139
if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "cuidados"
    ids = sys.argv[2:] or ["3287"]
    ctx, fts = buscar_contexto(q, ids)
    print(f"course_ids={ids}  query={q!r}")
    print(f"fuentes={len(fts)}")
    for f in fts:
        print(f"  - [{f['course_id']}] {f['titulo'][:60]}")
    print("\n--- contexto (primeros 600 car.) ---")
    print(ctx[:600])
