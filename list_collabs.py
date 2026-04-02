import asyncio
import sys
import os
from sqlalchemy import select

# Adicionar o diretório 'backend' ao sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.database import AsyncSessionLocal
from app.models.operational import Collaborator

async def list_collabs():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Collaborator))
        collaborators = result.scalars().all()
        for c in collaborators:
            print(f"'{c.name}'")

if __name__ == "__main__":
    asyncio.run(list_collabs())
