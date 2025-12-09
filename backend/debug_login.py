import asyncio
import sqlite3
from app.database import DATABASE_URL
from app.auth import verify_password, get_password_hash
from app.models.users import User
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession

# Parse DB URL for sqlite3 fallback check
# DATABASE_URL is "sqlite+aiosqlite:///./centauro.db"
DB_FILE = "./centauro.db"

async def check_login_debug():
    print("--- DEBUGGING LOGIN ---")
    
    # 1. Check Schema via sqlite3
    print("\n[1] Checking Schema (sqlite3)...")
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # Check Fleet Columns
        cursor.execute("PRAGMA table_info(fleet)")
        columns = cursor.fetchall()
        col_names = [c[1] for c in columns]
        print(f"Fleet columns: {col_names}")
        if 'odometer' in col_names:
            print("✅ 'odometer' column EXISTS.")
        else:
            print("❌ 'odometer' column MISSING!")
            
        # Check Users count
        cursor.execute("SELECT count(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"Total Users: {count}")
        
        # Check Lucas
        email = "lucas.silva@centauro.com.br"
        cursor.execute("SELECT email, password_hash, role FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        conn.close()
    except Exception as e:
        print(f"❌ Error checking sqlite3: {e}")
        return

    # 2. Verify Password Logic
    print("\n[2] Verifying User & Password...")
    if not user:
        print(f"❌ User '{email}' NOT FOUND in database.")
    else:
        print(f"✅ User found: {user[0]}")
        stored_hash = user[1]
        role = user[2]
        print(f"   Role: {role}")
        print(f"   Stored Hash (prefix): {stored_hash[:10]}...")
        
        test_pass = "senha123"
        is_valid = verify_password(test_pass, stored_hash)
        
        if is_valid:
            print(f"✅ Password '{test_pass}' is VALID against stored hash.")
        else:
            print(f"❌ Password '{test_pass}' is INVALID against stored hash.")
            
            # Diagnostic: Create new hash
            new_hash = get_password_hash(test_pass)
            print(f"   Expected Hash for '{test_pass}' would look like: {new_hash[:10]}...")
            
    print("\n-----------------------")

if __name__ == "__main__":
    asyncio.run(check_login_debug())
