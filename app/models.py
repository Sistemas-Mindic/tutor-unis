# app/models.py
from pydantic import BaseModel
from typing import List

# 1. Modelo para una pregunta simple
class PreguntaUsuario(BaseModel):
    texto: str

# 2. Modelos para el HISTORIAL
class MessageHistory(BaseModel):
    role: str 
    text: str

class MemoryUpdate(BaseModel):
    messages: List[MessageHistory]