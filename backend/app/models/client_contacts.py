"""
Model for Client Contacts - Multiple contacts per client with departments
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ContactDepartment(str, enum.Enum):
    COMERCIAL = "Comercial"
    ENGENHARIA = "Engenharia"
    FINANCEIRO = "Financeiro"
    RH = "RH"
    SUPORTE = "Suporte"
    DIRETORIA = "Diretoria"
    GERAL = "Geral"


class ClientContact(Base):
    __tablename__ = "client_contacts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    department = Column(String, default="Geral")

    # Use string reference to avoid circular import
    client = relationship("Client", back_populates="contacts")
