import asyncio
import sys
import os

# Add the current directory to sys.path to resolve 'app'
sys.path.append(os.getcwd())

from sqlalchemy import select
from app.database import AsyncSessionLocal     
from app.models.operational import Collaborator
from app.models.roles import Role

async def fix_collaborator_roles():
    async with AsyncSessionLocal() as session:
        # Fetch all roles
        result = await session.execute(select(Role))
        roles = result.scalars().all()
        role_map = {r.name: r.id for r in roles}
        
        # Fetch collaborators with missing role_id
        result = await session.execute(select(Collaborator))
        collaborators = result.scalars().all()
        
        updated_count = 0
        for col in collaborators:
            if not col.role_id and col.role:
                if col.role in role_map:
                    col.role_id = role_map[col.role]
                    updated_count += 1
                    print(f"Updating {col.name}: Set role_id={col.role_id} for role='{col.role}'")
                else:
                    print(f"Warning: Role '{col.role}' not found for collaborator {col.name}")
        
        if updated_count > 0:
            await session.commit()
            print(f"Successfully updated {updated_count} collaborators.")
        else:
            print("No collaborators needed updating.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(fix_collaborator_roles())
