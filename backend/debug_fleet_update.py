import asyncio
import sys
import os

# Add backend path
sys.path.append(os.getcwd())

from app.database import AsyncSessionLocal
from app.models.assets import Fleet, FuelType, FleetStatus
from sqlalchemy import select

async def debug_update():
    async with AsyncSessionLocal() as db:
        print("🔍 Fetching Fleet ID 3...")
        result = await db.execute(select(Fleet).where(Fleet.id == 3))
        vehicle = result.scalar_one_or_none()
        
        if not vehicle:
            print("❌ Vehicle not found!")
            return

        print(f"✅ Found: {vehicle.license_plate}")
        
        # Simulate Update
        print("🔄 Attempting Update...")
        try:
            # Values from screenshot
            vehicle.license_plate = "DEF-5678"
            vehicle.model = "Strada"
            vehicle.brand = "Fiat"
            vehicle.year = 2024
            vehicle.color = "Vermelha"
            vehicle.fuel_type = FuelType("Flex") # Simulating Pydantic conversion
            vehicle.insurance_id = 3
            vehicle.odometer = 0
            vehicle.status = FleetStatus("ACTIVE")
            
            # If SQLAlchemy is strict about Enums, this might fail or fail at commit
            db.add(vehicle)
            await db.commit()
            print("✅ Update Successful! (Commit passed)")
            
        except Exception as e:
            print(f"❌ Update Failed: {e!r}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_update())
