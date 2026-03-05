import sqlite3

try:
    conn = sqlite3.connect('centauro.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE commercial_proposals ADD COLUMN converted_contract_id INTEGER REFERENCES contracts(id)")
    conn.commit()
    print("Column converted_contract_id added successfully.")
except sqlite3.OperationalError as e:
    print(f"OperationalError: {e}")
finally:
    if conn:
        conn.close()
