import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import sys

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import DATABASE_URL

async def migrate():
    # Force use the deploy URL if provided by user in conversation
    deploy_url = "postgresql+asyncpg://postgres:HdRksQOjchuaJZAytjNIsrZnuWWnWcAZ@centerbeam.proxy.rlwy.net:24604/railway"
    print(f"Connecting to {deploy_url}...")
    engine = create_async_engine(deploy_url)
    
    async with engine.begin() as conn:
        # 1. Try to add column
        print("Ensuring 'crm_department' column exists...")
        try:
            await conn.execute(text("ALTER TABLE commercial_proposals ADD COLUMN crm_department VARCHAR DEFAULT 'COMERCIAL'"))
            print("Column added.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column already exists.")
            else:
                print(f"Column Error: {e}")

        # 2. Force update NULL and existing records to COMERCIAL if they belong there
        # This ensures existing ones return to the Commercial tab.
        print("Updating existing records to 'COMERCIAL' where department is missing...")
        try:
            result = await conn.execute(text("UPDATE commercial_proposals SET crm_department = 'COMERCIAL' WHERE crm_department IS NULL OR crm_department = ''"))
            print(f"Updated {result.rowcount} records.")
        except Exception as e:
            print(f"Update Error: {e}")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
