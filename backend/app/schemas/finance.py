from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import date as DateType
from decimal import Decimal

# Project Billing Schemas
class ProjectBillingBase(BaseModel):
    value: Decimal # This will now be treated as Gross Value in simple view, or legacy support
    date: Optional[DateType] = None # Due Date
    issue_date: Optional[DateType] = None
    payment_date: Optional[DateType] = None
    invoice_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "PREVISTO"
    attachment_url: Optional[str] = None
    replaced_by_id: Optional[int] = None

    # New Fields
    category: Optional[str] = "SERVICE"
    gross_value: Optional[Decimal] = 0
    net_value: Optional[Decimal] = 0
    taxes_verified: Optional[bool] = False

    retention_iss: Optional[Decimal] = 0
    retention_inss: Optional[Decimal] = 0
    retention_irrf: Optional[Decimal] = 0
    retention_pis: Optional[Decimal] = 0
    retention_cofins: Optional[Decimal] = 0
    retention_csll: Optional[Decimal] = 0

    # Non-retained taxes (Service)
    tax_iss: Optional[Decimal] = 0
    tax_pis: Optional[Decimal] = 0
    tax_cofins: Optional[Decimal] = 0
    tax_irpj: Optional[Decimal] = 0

    # Taxes (Material)
    tax_icms: Optional[Decimal] = 0
    tax_ipi: Optional[Decimal] = 0
    value_st: Optional[Decimal] = 0

class ProjectBillingCreate(ProjectBillingBase):
    # Fields for substitution workflow
    substitution_invoice_number: Optional[str] = None
    substitution_issue_date: Optional[DateType] = None
    substitution_due_date: Optional[DateType] = None
    substitution_reason: Optional[str] = None  # Motivo da substituição

class ProjectBillingResponse(ProjectBillingBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Tax Import Schemas
class TaxImportItem(BaseModel):
    billing_id: int
    invoice_number: str
    project_tag: str
    client_name: str
    category: str
    gross_value: float
    net_value: float
    diff_gross: float # Difference between new gross and old value
    diff_net: float # Difference between new net and old value (if net existed seems unlikely in legacy, but maybe useful)
    updates: Dict[str, Any] # Dictionary containing all fields to be updated

class TaxImportPreviewResponse(BaseModel):
    items: List[TaxImportItem]
    found_count: int
    total_value: float
    logs: List[str]

class TaxImportConfirmRequest(BaseModel):
    items: List[TaxImportItem]
