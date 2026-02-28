from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.email_service import email_service
import traceback

router = APIRouter(prefix="/test-email", tags=["Email Testing"])

class EmailSchema(BaseModel):
    email: EmailStr

class DailyBriefingSchema(BaseModel):
    email: Optional[EmailStr] = None  # If None, uses default recipient

@router.post("/")
async def send_test_email(body: EmailSchema):
    """
    Envia um email de teste (Daily Briefing Mockado) para o endereço especificado.
    """
    try:
        await email_service.send_test_email(body.email)
        return {"message": "Email de teste enviado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar email: {str(e)}\n{traceback.format_exc()}")

@router.post("/daily-briefing")
async def send_daily_briefing(body: DailyBriefingSchema = None):
    """
    Envia o Daily Briefing com tarefas REAIS do banco de dados.
    Se nenhum email for especificado, envia para o destinatário padrão.
    """
    try:
        email_to = body.email if body and body.email else None
        result = await email_service.send_daily_briefing(email_to)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar email: {str(e)}\n{traceback.format_exc()}")

