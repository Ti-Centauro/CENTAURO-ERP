import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
import sys

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import DATABASE_URL

async def check():
    deploy_url = "postgresql+asyncpg://postgres:HdRksQOjchuaJZAytjNIsrZnuWWnWcAZ@centerbeam.proxy.rlwy.net:24604/railway"
    engine = create_async_engine(deploy_url)
    
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT crm_department, count(*) FROM commercial_proposals GROUP BY crm_department"))
        rows = result.all()
        print("Department Counts:")
        for row in rows:
            print(f"{row[0]}: {row[1]}")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
