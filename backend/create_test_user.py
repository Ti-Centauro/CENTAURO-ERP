import asyncio
import sys
import os

# Add backend directory to path
sys.path.append(os.getcwd())

from app.database import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.operational import Collaborator
from app.models.roles import Role
from app.models.teams import Team
from app.models.collaborator_teams import collaborator_teams
from app.auth import get_password_hash
from sqlalchemy import select, insert
from sqlalchemy.orm import selectinload

async def create_test_data():
    async with AsyncSessionLocal() as db:
        print("Creating test data...")
        
        # 1. Create Role if needed
        result = await db.execute(select(Role).where(Role.name == "Coordenador"))
        role = result.scalars().first()
        if not role:
            role = Role(name="Coordenador", permissions={"scheduler": ["read", "write", "edit"], "projects": ["read"]})
            db.add(role)
            await db.flush()
            print("Created Role: Coordenador")
            
        # 2. Create Collaborator (The User)
        result = await db.execute(select(Collaborator).where(Collaborator.email == "teste@centauro.com.br"))
        collab = result.scalars().first()
        if not collab:
            collab = Collaborator(
                name="Usuario Teste Scheduler",
                email="teste@centauro.com.br",
                role_id=role.id,
                phone="11999999999"
            )
            db.add(collab)
            await db.flush()
            print("Created Collaborator: Usuario Teste Scheduler")
        else:
            print("Collaborator already exists")
            
        # 3. Create Teams
        # Team A (Leader: Test User)
        result_a = await db.execute(select(Team).where(Team.name == "Equipe Teste A"))
        team_a = result_a.scalars().first()
        if not team_a:
            team_a = Team(name="Equipe Teste A", leader_id=collab.id)
            db.add(team_a)
            print("Created Team: Equipe Teste A (Leader: Test User)")
        else:
            team_a.leader_id = collab.id
            db.add(team_a)
            print("Updated Team A leader")
            
        # Team B (User is NOT involved)
        result_b = await db.execute(select(Team).where(Team.name == "Equipe Teste B"))
        team_b = result_b.scalars().first()
        if not team_b:
            team_b = Team(name="Equipe Teste B") # No leader or different leader
            db.add(team_b)
            print("Created Team: Equipe Teste B")
            
        # 4. Create Collaborator for Team B
        result = await db.execute(
            select(Collaborator)
            .options(selectinload(Collaborator.teams))
            .where(Collaborator.email == "membro.b@centauro.com.br")
        )
        collab_b = result.scalars().first()
        if not collab_b:
            collab_b = Collaborator(
                name="Membro Equipe B",
                email="membro.b@centauro.com.br",
                role_id=role.id
            )
            db.add(collab_b)
            await db.flush()
            # Add to Team B via direct insert to avoid async ORM lazy load issues
            await db.execute(insert(collaborator_teams).values(collaborator_id=collab_b.id, team_id=team_b.id))
            print("Created Collaborator: Membro Equipe B (in Team B)")
        else:
             # Just checking if link exists is hard without load. Skipping for simplicity.
             pass
        
        # 5. Create User
        result = await db.execute(select(User).where(User.email == "teste@centauro.com.br"))
        user = result.scalars().first()
        if not user:
            user = User(
                email="teste@centauro.com.br",
                password_hash=get_password_hash("123456"),
                role=UserRole.ENGENHARIA,
                is_superuser=False,
                collaborator_id=collab.id
            )
            db.add(user)
            print("Created User: teste@centauro.com.br / 123456")
        else:
            user.password_hash = get_password_hash("123456")
            user.collaborator_id = collab.id
            user.is_superuser = False
            db.add(user)
            print("Updated User: teste@centauro.com.br")

        await db.commit()
        print("Done!")

if __name__ == "__main__":
    asyncio.run(create_test_data())
