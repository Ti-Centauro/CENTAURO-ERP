import asyncio
import sys
import os
import pandas as pd
from sqlalchemy import select

sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{os.path.join(os.getcwd(), 'backend', 'centauro.db')}"

from app.database import AsyncSessionLocal
from app.models.operational import Collaborator

async def diagnostic():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Collaborator))
        db_names = [c.name for c in result.scalars().all()]
        
    df = pd.read_excel("Controle de Treinamentos - Centauro.xlsx", header=None)
    excel_names = df.iloc[4:, 0].dropna().astype(str).tolist()
    
    with open("diagnostic.txt", "w", encoding='utf-8') as f:
        f.write("DB NAMES:\n")
        f.write("\n".join(db_names))
        f.write("\n\nEXCEL NAMES:\n")
        f.write("\n".join(excel_names))

if __name__ == "__main__":
    asyncio.run(diagnostic())
