from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum

class MaintenanceType(str, Enum):
    PREVENTIVA = "PREVENTIVA"
    CORRETIVA = "CORRETIVA"

class VehicleMaintenanceBase(BaseModel):
    vehicle_id: int
    workshop_name: str
    entry_date: date
    exit_date: Optional[date] = None
    cost: float
    odometer: int
    maintenance_type: MaintenanceType
    categories: str
    description: Optional[str] = None
    attachment: Optional[str] = None

class VehicleMaintenanceCreate(VehicleMaintenanceBase):
    pass

class VehicleMaintenanceResponse(VehicleMaintenanceBase):
    id: int

    class Config:
        from_attributes = True
