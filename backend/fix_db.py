import sqlite3
import asyncio
from app.auth import get_password_hash

# Database file path - assuming it's in the same directory or adjust path
DB_PATH = "./centauro.db"

def fix_schema():
    print("Fixing Schema...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Add odometer to fleet if missing
    try:
        cursor.execute("SELECT odometer FROM fleet LIMIT 1")
    except sqlite3.OperationalError:
        print("Adding 'odometer' column to 'fleet' table...")
        cursor.execute("ALTER TABLE fleet ADD COLUMN odometer INTEGER DEFAULT 0")
        conn.commit()
    else:
        print("'odometer' column already exists in 'fleet'.")

    # 2. Check vehicle_maintenances (create_all usually handles this, but let's check)
    # create_all in main.py runs on startup, so it might have created it if it didn't crash before.
    # We won't manually create the table here, we rely on main.py for new tables, 
    # but we can try to force it if needed. For now, let's assume startup handles new tables.
    
    conn.close()

def reset_password():
    print("Resetting Password...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT email FROM users")
    users = cursor.fetchall()
    print("Users in DB:", users)
    
    email = "lucas.silva@centauro.com.br"
    password = "senha123"
    hashed = get_password_hash(password)
    
    # Update password
    cursor.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed, email))
    if cursor.rowcount > 0:
        print(f"Password for {email} reset to '{password}'.")
    else:
        print(f"User {email} not found.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    fix_schema()
    reset_password()
