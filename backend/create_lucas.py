import asyncio
import sys
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.operational import Collaborator
from app.models.teams import Team
from app.auth import get_password_hash

async def create_user_lucas():
    async with AsyncSessionLocal() as db:
        # 1. Check for Team
        result = await db.execute(select(Team).where(Team.name == "Diretoria"))
        team = result.scalars().first()
        if not team:
            print("⚠️ Team 'Diretoria' not found. Creating...")
            team = Team(name="Diretoria", description="Diretoria Executiva")
            db.add(team)
            await db.flush()

        # 2. Check/Create Collaborator
        result = await db.execute(select(Collaborator).where(Collaborator.name == "Lucas Silva"))
        collaborator = result.scalars().first()
        
        if not collaborator:
            print("⚠️ Collaborator 'Lucas Silva' not found. Creating...")
            collaborator = Collaborator(
                name="Lucas Silva",
                cpf="000.000.000-00",
                rg="00.000.000-0",
                email="lucas.silva@centauro.com.br",
                phone="11999999999",
                salary=15000.00,
                role_id=4, # Assuming 4 is Diretoria/Admin
                role="Diretor",
                team_id=team.id
            )
            db.add(collaborator)
            await db.flush()
            print(f"✅ Created Collaborator: {collaborator.name} (ID: {collaborator.id})")
        else:
            print(f"✅ Found Collaborator: {collaborator.name} (ID: {collaborator.id})")

        # 3. Check/Create User
        # We use the collaborator's email for the login
        email = collaborator.email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if user:
            print(f"ℹ️ User {email} already exists. Updating link & resetting password...")
            user.collaborator_id = collaborator.id
            user.password_hash = get_password_hash("senha123")
            user.is_superuser = True
        else:
            print(f"Creating new user for {email}...")
            user = User(
                email=email,
                password_hash=get_password_hash("senha123"),
                role=UserRole.VISUALIZADOR, # Role comes from Collaborator
                collaborator_id=collaborator.id,
                is_superuser=True
            )
            db.add(user)
        
        await db.commit()
        print(f"✅ User {email} created/updated successfully!")
        print(f"   Login: {email}")
        print(f"   Password: senha123")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_user_lucas())
