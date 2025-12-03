from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.database import get_db
from app.models import purchases as models
from app.schemas import purchases as schemas

router = APIRouter()

from sqlalchemy.orm import selectinload

@router.get("/purchases", response_model=List[schemas.PurchaseRequestResponse])
async def get_purchases(
    project_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(models.PurchaseRequest).options(selectinload(models.PurchaseRequest.items))
    if project_id:
        query = query.where(models.PurchaseRequest.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/purchases", response_model=schemas.PurchaseRequestResponse)
async def create_purchase(purchase: schemas.PurchaseRequestCreate, db: AsyncSession = Depends(get_db)):
    # Create Request
    db_request = models.PurchaseRequest(
        project_id=purchase.project_id,
        description=purchase.description,
        requester=purchase.requester,
        status=purchase.status
    )
    db.add(db_request)
    await db.commit()
    await db.refresh(db_request)

    # Create Items if any
    if purchase.items:
        for item in purchase.items:
            db_item = models.PurchaseItem(**item.model_dump(), request_id=db_request.id)
            db.add(db_item)
        await db.commit()
        await db.refresh(db_request) # Refresh to load items

    # Re-fetch with items to ensure response model is satisfied
    result = await db.execute(select(models.PurchaseRequest).options(selectinload(models.PurchaseRequest.items)).where(models.PurchaseRequest.id == db_request.id))
    return result.scalar_one()

@router.get("/purchases/{id}", response_model=schemas.PurchaseRequestResponse)
async def get_purchase(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.PurchaseRequest).options(selectinload(models.PurchaseRequest.items)).where(models.PurchaseRequest.id == id))
    db_purchase = result.scalar_one_or_none()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    return db_purchase

@router.put("/purchases/{id}", response_model=schemas.PurchaseRequestResponse)
async def update_purchase(id: int, purchase: schemas.PurchaseRequestCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.PurchaseRequest).options(selectinload(models.PurchaseRequest.items)).where(models.PurchaseRequest.id == id))
    db_purchase = result.scalar_one_or_none()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    
    # Update Request fields
    db_purchase.project_id = purchase.project_id
    db_purchase.description = purchase.description
    db_purchase.requester = purchase.requester
    db_purchase.status = purchase.status
    
    # Update Items (Full replacement strategy for simplicity in this prototype)
    # Delete existing items
    for item in db_purchase.items:
        await db.delete(item)
    
    # Add new items
    if purchase.items:
        for item in purchase.items:
            db_item = models.PurchaseItem(**item.model_dump(), request_id=db_purchase.id)
            db.add(db_item)
    
    await db.commit()
    await db.refresh(db_purchase)
    
    # Re-fetch
    result = await db.execute(select(models.PurchaseRequest).options(selectinload(models.PurchaseRequest.items)).where(models.PurchaseRequest.id == id))
    return result.scalar_one()

@router.delete("/purchases/{id}")
async def delete_purchase(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.PurchaseRequest).where(models.PurchaseRequest.id == id))
    db_purchase = result.scalar_one_or_none()
    if not db_purchase:
        raise HTTPException(status_code=404, detail="Purchase request not found")
    
    await db.delete(db_purchase)
    await db.commit()
    return {"message": "Purchase request deleted"}

# Item management endpoints (optional, but good for granular updates)
@router.post("/purchases/{id}/items", response_model=schemas.PurchaseItemResponse)
async def create_purchase_item(id: int, item: schemas.PurchaseItemCreate, db: AsyncSession = Depends(get_db)):
    # Verify request exists
    result = await db.execute(select(models.PurchaseRequest).where(models.PurchaseRequest.id == id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Purchase request not found")

    db_item = models.PurchaseItem(**item.model_dump(), request_id=id)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.delete("/purchases/items/{item_id}")
async def delete_purchase_item(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.PurchaseItem).where(models.PurchaseItem.id == item_id))
    db_item = result.scalar_one_or_none()
    if not db_item:
        raise HTTPException(status_code=404, detail="Purchase item not found")
    
    await db.delete(db_item)
    await db.commit()
    return {"message": "Purchase item deleted"}
