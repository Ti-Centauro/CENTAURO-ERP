"""
Finance Models
Contains ProjectBilling and related financial entities
Moved from commercial.py for domain separation
"""
from sqlalchemy import Column, Integer, String, ForeignKey, Numeric, Date, Enum, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class BillingStatus(str, enum.Enum):
    """Status of a project billing"""
    PREVISTO = "PREVISTO"
    EMITIDA = "EMITIDA"
    PAGO = "PAGO"
    VENCIDA = "VENCIDA"
    CANCELADA = "CANCELADA"
    SUBSTITUIDA = "SUBSTITUIDA"


class ProjectBilling(Base):
    """
    Project Billing / Invoice model
    Represents invoices and expected payments for projects
    """
    __tablename__ = "project_billings"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    value = Column(Numeric(10, 2))
    date = Column(Date, nullable=True)  # Due Date (Vencimento)
    issue_date = Column(Date, nullable=True)  # Data de Emissão
    payment_date = Column(Date, nullable=True)  # Data de Pagamento
    invoice_number = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(Enum(BillingStatus), default=BillingStatus.PREVISTO)
    attachment_url = Column(String, nullable=True)
    replaced_by_id = Column(Integer, ForeignKey("project_billings.id"), nullable=True)
    substitution_reason = Column(String, nullable=True)  # Motivo da substituição

    # Relationships - Using string reference to avoid circular imports
    project = relationship("Project", back_populates="billings")
    replaced_by = relationship("ProjectBilling", remote_side=[id])

    # Financial Fields
    category = Column(Enum("SERVICE", "MATERIAL", name="billing_category"), default="SERVICE")
    gross_value = Column(Numeric(10, 2), default=0)  # Valor da Nota / Bruto
    net_value = Column(Numeric(10, 2), default=0)  # Valor Líquido (Caixa)
    taxes_verified = Column(Boolean, default=False)

    # Retentions (Service) - Impostos retidos pelo cliente
    retention_iss = Column(Numeric(10, 2), default=0)
    retention_inss = Column(Numeric(10, 2), default=0)
    retention_irrf = Column(Numeric(10, 2), default=0)
    retention_pis = Column(Numeric(10, 2), default=0)
    retention_cofins = Column(Numeric(10, 2), default=0)
    retention_csll = Column(Numeric(10, 2), default=0)
    
    # Non-Retained Taxes (Service) - Impostos que a empresa paga
    tax_pis = Column(Numeric(10, 2), default=0)
    tax_cofins = Column(Numeric(10, 2), default=0)
    tax_iss = Column(Numeric(10, 2), default=0)
    tax_irpj = Column(Numeric(10, 2), default=0)

    # Taxes (Material)
    tax_icms = Column(Numeric(10, 2), default=0)
    tax_ipi = Column(Numeric(10, 2), default=0)
    value_st = Column(Numeric(10, 2), default=0)
