import sqlite3

conn = sqlite3.connect('centauro.db')
cursor = conn.cursor()

# Check and Add company_id to contracts
try:
    cursor.execute("ALTER TABLE contracts ADD COLUMN company_id INTEGER")
    print("Added company_id to contracts table")
except sqlite3.OperationalError as e:
    print(f"company_id might already exist in contracts: {e}")

conn.commit()
conn.close()
