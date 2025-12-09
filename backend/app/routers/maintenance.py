from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.database import get_db
from app.models import assets as models
from app.schemas import maintenance as schemas
from datetime import date

router = APIRouter()

@router.get("/maintenance/vehicle/{vehicle_id}", response_model=List[schemas.VehicleMaintenanceResponse])
async def get_vehicle_maintenances(vehicle_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.VehicleMaintenance)
        .where(models.VehicleMaintenance.vehicle_id == vehicle_id)
        .order_by(desc(models.VehicleMaintenance.entry_date))
    )
    return result.scalars().all()

@router.post("/maintenance", response_model=schemas.VehicleMaintenanceResponse)
async def create_maintenance(data: schemas.VehicleMaintenanceCreate, db: AsyncSession = Depends(get_db)):
    # Create Maintenance Record
    db_item = models.VehicleMaintenance(**data.model_dump())
    db.add(db_item)
    
    # Update Vehicle Odometer Logic
    result = await db.execute(select(models.Fleet).where(models.Fleet.id == data.vehicle_id))
    vehicle = result.scalar_one_or_none()
    
    if vehicle:
        # Ensure we don't downgrade odometer by mistake, only update if greater
        # Assuming vehicle.odometer can be None or 0 initially
        current_odom = vehicle.odometer or 0
        if data.odometer > current_odom:
            vehicle.odometer = data.odometer

        # Auto-update status
        today = date.today()
        # Active if: Started (entry <= today) AND Not Finished (exit None or future)
        is_active = data.entry_date <= today and (not data.exit_date or data.exit_date > today)
        
        if is_active:
            vehicle.status = models.FleetStatus.MAINTENANCE
        else:
            vehicle.status = models.FleetStatus.ACTIVE
            
        db.add(vehicle)

    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.put("/maintenance/{id}", response_model=schemas.VehicleMaintenanceResponse)
async def update_maintenance(id: int, data: schemas.VehicleMaintenanceCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.VehicleMaintenance).where(models.VehicleMaintenance.id == id))
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
        
    for key, value in data.model_dump().items():
        setattr(db_item, key, value)
        
    # Check odometer again just in case (optional, but good practice)
    # If editing a past maintenance to a higher odometer, should we update vehicle?
    # Probably yes, if it's the highest. But let's stick to simple logic: 
    # If this edit pushes the odometer higher than current vehicle, update it.
    
    result_v = await db.execute(select(models.Fleet).where(models.Fleet.id == data.vehicle_id))
    vehicle = result_v.scalar_one_or_none()
    if vehicle:
        current_odom = vehicle.odometer or 0
        if data.odometer > current_odom:
            vehicle.odometer = data.odometer

        # Auto-update status
        today = date.today()
        # Active if: Started (entry <= today) AND Not Finished (exit None or future)
        is_active = data.entry_date <= today and (not data.exit_date or data.exit_date > today)

        if is_active:
            vehicle.status = models.FleetStatus.MAINTENANCE
        else:
            vehicle.status = models.FleetStatus.ACTIVE

        db.add(vehicle)

    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.delete("/maintenance/{id}")
async def delete_maintenance(id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.VehicleMaintenance).where(models.VehicleMaintenance.id == id))
    db_item = result.scalar_one_or_none()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
        
    await db.delete(db_item)
    await db.commit()
    return {"message": "Deleted successfully"}
