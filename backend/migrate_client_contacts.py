"""
Simple script to create client_contacts table and migrate data using raw SQL
"""
import sqlite3
import os

db_path = "centauro.db"

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create table
print("📦 Creating client_contacts table...")
cursor.execute('''
    CREATE TABLE IF NOT EXISTS client_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        department TEXT DEFAULT 'Geral',
        FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
''')

# Migrate existing data
print("📋 Migrating contact_person data...")
cursor.execute('''
    SELECT id, name, contact_person FROM clients WHERE contact_person IS NOT NULL AND contact_person != ''
''')
clients = cursor.fetchall()

migrated = 0
for client_id, client_name, contact_person in clients:
    # Check if already migrated
    cursor.execute('SELECT COUNT(*) FROM client_contacts WHERE client_id = ? AND name = ?', (client_id, contact_person))
    exists = cursor.fetchone()[0]
    
    if not exists and contact_person.strip():
        cursor.execute('''
            INSERT INTO client_contacts (client_id, name, department)
            VALUES (?, ?, 'Geral')
        ''', (client_id, contact_person))
        print(f"  ✅ Migrated: {client_name} -> {contact_person}")
        migrated += 1
    else:
        print(f"  ⏭️  Already exists: {client_name}")

conn.commit()
conn.close()

print(f"✨ Migration complete! {migrated} contacts created.")
