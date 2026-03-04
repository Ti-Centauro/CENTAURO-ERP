import sqlite3

try:
    conn = sqlite3.connect('centauro.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE commercial_proposals ADD COLUMN decision_date DATE;")
    conn.commit()
    print("Column 'decision_date' added successfully to centauro.db.")
except sqlite3.OperationalError as e:
    print(f"OperationalError: {e}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
