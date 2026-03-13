"""
Contracts Router - CRUD operations for Contracts
Extracted from commercial.py during modularization
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import date
from typing import List

from app.database import get_db
from app.models import commercial as models
from app.schemas import commercial as schemas
from app.utils.messages import Msg

router = APIRouter()


# ========== CONTRACTS CRUD ==========

@router.get("/contracts", response_model=List[schemas.ContractResponse])
async def get_contracts(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(models.Contract))
        contracts = result.scalars().all()
        
        # Calculate status dynamically
        today = date.today()
        for contract in contracts:
            if contract.end_date and contract.end_date < today:
                contract.status = "Vencido"
            else:
                contract.status = "Ativo"
                
        return contracts
    except Exception as e:
        print(f"ERROR getting contracts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao listar contratos: {str(e)}")


@router.post("/contracts", response_model=schemas.ContractResponse)
async def create_contract(contract: schemas.ContractCreate, db: AsyncSession = Depends(get_db)):
    try:
        # 1. TAG manual — normalizar e validar unicidade
        tag = contract.contract_number.strip().upper()
        
        # Verificar se a TAG já existe em Contratos
        existing_contract = await db.execute(
            select(models.Contract).where(models.Contract.contract_number == tag)
        )
        if existing_contract.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=Msg.TAG_ALREADY_EXISTS)
        
        # Verificar se a TAG já existe em Projetos
        existing_project = await db.execute(
            select(models.Project).where(models.Project.tag == tag)
        )
        if existing_project.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=Msg.TAG_ALREADY_EXISTS)
            
        # Verificar se a TAG já existe em Propostas
        from app.models.proposals import CommercialProposal
        existing_prop = await db.execute(
            select(CommercialProposal).where(CommercialProposal.internal_id == tag)
        )
        if existing_prop.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Esta TAG já está em uso em uma Proposta.")

        # 2. Create Contract
        db_contract = models.Contract(**contract.model_dump())
        db_contract.contract_number = tag
        
        db.add(db_contract)
        await db.commit()
        await db.refresh(db_contract)
        
        # Set status for response
        today = date.today()
        if db_contract.end_date and db_contract.end_date < today:
            db_contract.status = "Vencido"
        else:
            db_contract.status = "Ativo"
            
        return db_contract
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR creating contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao criar contrato: {str(e)}")


@router.delete("/contracts/{contract_id}")
async def delete_contract(contract_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(models.Contract).where(models.Contract.id == contract_id))
        contract = result.scalar_one_or_none()
        if not contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        await db.delete(contract)
        await db.commit()
        return {"message": "Contract deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR deleting contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao excluir contrato: {str(e)}")


@router.put("/contracts/{contract_id}", response_model=schemas.ContractResponse)
async def update_contract(contract_id: int, contract: schemas.ContractCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(models.Contract).where(models.Contract.id == contract_id))
        db_contract = result.scalar_one_or_none()
        if not db_contract:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        # Update fields
        contract_data = contract.model_dump(exclude_unset=True)
        
        for key, value in contract_data.items():
            if key != "contract_number": # Protect TAG
                setattr(db_contract, key, value)
        
        await db.commit()
        await db.refresh(db_contract)
        
        # Set status for response
        today = date.today()
        if db_contract.end_date and db_contract.end_date < today:
            db_contract.status = "Vencido"
        else:
            db_contract.status = "Ativo"
            
        return db_contract
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR updating contract: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar contrato: {str(e)}")
