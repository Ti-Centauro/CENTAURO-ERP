from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.rag.engine import rag_engine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint para conversar com o Agente RAG do Centauro ERP.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    response_text = rag_engine.chat(request.message)
    return ChatResponse(response=response_text)
