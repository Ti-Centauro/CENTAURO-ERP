"""
Billings Router - CRUD operations for Project Billings and Tax Import
Extracted from commercial.py during modularization
This module handles all financial billing logic including:
- Billing CRUD operations
- Tax import preview and confirmation (Excel processing)
"""
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import date
from typing import List

from app.database import get_db
from app.models import commercial as commercial_models
from app.models.finance import ProjectBilling, BillingStatus
from app.schemas import finance as schemas
from app.services.finance.tax_service import TaxService

router = APIRouter()


# ========== BILLINGS CRUD ==========

@router.post("/projects/{project_id}/billings", response_model=schemas.ProjectBillingResponse)
async def create_project_billing(project_id: int, billing: schemas.ProjectBillingCreate, db: AsyncSession = Depends(get_db)):
    # Default status to PREVISTO if not provided (though schema might have default)
    # Exclude fields that are not in the database model
    billing_data = billing.model_dump(exclude={'substitution_invoice_number', 'substitution_issue_date', 'substitution_due_date'})
    if 'status' not in billing_data or not billing_data['status']:
        billing_data['status'] = BillingStatus.PREVISTO
        
    db_billing = ProjectBilling(**billing_data, project_id=project_id)
    db.add(db_billing)
    await db.commit()
    await db.refresh(db_billing)
    return db_billing


@router.delete("/projects/billings/{billing_id}")
async def delete_project_billing(billing_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectBilling).where(ProjectBilling.id == billing_id))
    billing = result.scalar_one_or_none()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    if billing.status != BillingStatus.PREVISTO:
        raise HTTPException(status_code=400, detail="Apenas faturamentos com status PREVISTO podem ser excluídos.")

    await db.delete(billing)
    await db.commit()
    return {"message": "Billing deleted"}


@router.get("/billings", response_model=List[schemas.ProjectBillingResponse])
async def get_all_billings(db: AsyncSession = Depends(get_db)):
    # 1. Fetch all billings
    result = await db.execute(select(ProjectBilling))
    billings = result.scalars().all()
    
    # 2. Apply Overdue Logic
    today = date.today()
    updated = False
    for b in billings:
        if b.status == BillingStatus.EMITIDA and b.date and b.date < today:
            b.status = BillingStatus.VENCIDA
            db.add(b)
            updated = True
            
    if updated:
        await db.commit()
        # Re-fetch to get updated states
        result = await db.execute(select(ProjectBilling))
        billings = result.scalars().all()
        
    return billings


@router.put("/billings/{billing_id}", response_model=schemas.ProjectBillingResponse)
async def update_project_billing(billing_id: int, billing: schemas.ProjectBillingCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ProjectBilling).where(ProjectBilling.id == billing_id))
    db_billing = result.scalar_one_or_none()
    if not db_billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    # Validate dates if status is EMITIDA
    if billing.status == BillingStatus.EMITIDA:
        if not billing.date or not billing.issue_date:
            raise HTTPException(status_code=400, detail="Data de Vencimento e Emissão são obrigatórias para status EMITIDA")
            
    # Handle Substitution
    if billing.status == BillingStatus.SUBSTITUIDA:
        if not billing.substitution_invoice_number or not billing.substitution_issue_date or not billing.substitution_due_date:
             raise HTTPException(status_code=400, detail="Dados da nova nota (Número, Emissão, Vencimento) são obrigatórios para SUBSTITUIÇÃO")
        
        # Guardar descrição original antes de modificar
        original_description = db_billing.description or ""
        
        # Atualizar descrição da nota antiga com o motivo
        reason = billing.substitution_reason or "Substituída"
        db_billing.description = f"{original_description} ({reason})"
        db_billing.substitution_reason = reason  # Salvar o motivo no campo
        
        # Create new billing - descrição com número da nota anterior
        new_billing = ProjectBilling(
            project_id=db_billing.project_id,
            value=db_billing.value, # Assuming same value
            description=f"{original_description} (Subst. {db_billing.invoice_number or 'Antiga'})",
            invoice_number=billing.substitution_invoice_number,
            issue_date=billing.substitution_issue_date,
            date=billing.substitution_due_date,
            status=BillingStatus.EMITIDA
        )
        db.add(new_billing)
        await db.flush() # Get ID
        
        # Link old billing to new one
        db_billing.replaced_by_id = new_billing.id
        
    for key, value in billing.model_dump(exclude_unset=True).items():
        if key not in ['substitution_invoice_number', 'substitution_issue_date', 'substitution_due_date', 'substitution_reason', 'description']:
             setattr(db_billing, key, value)
        
    await db.commit()
    await db.refresh(db_billing)
    return db_billing


# ========== TAX IMPORT ENDPOINTS ==========

@router.post("/billings/import-taxes/preview", response_model=schemas.TaxImportPreviewResponse)
async def preview_taxes_import(
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db)
):
    try:
        content = await file.read()
        return await TaxService.preview_taxes_import(content, file.filename, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billings/import-taxes/confirm")
async def confirm_taxes_import(
    request: schemas.TaxImportConfirmRequest,
    db: AsyncSession = Depends(get_db)
):
    updates_count = 0
    
    for item in request.items:
        result = await db.execute(select(ProjectBilling).where(ProjectBilling.id == item.billing_id))
        billing = result.scalar_one_or_none()
        
        if billing:
            for key, value in item.updates.items():
                setattr(billing, key, value)
            updates_count += 1
    
    await db.commit()
    return {"message": f"Importação confirmada. {updates_count} faturamentos atualizados."}
