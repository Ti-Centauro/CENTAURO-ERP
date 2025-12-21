
import sqlite3
import os

DB_PATH = "backend/centauro.db"

def add_column():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Attempting to add 'arrival_forecast' column explicitly...")
        # Add arrival_forecast column
        cursor.execute("ALTER TABLE purchase_requests ADD COLUMN arrival_forecast DATE")
        conn.commit()
        print("Successfully added 'arrival_forecast' column.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Column 'arrival_forecast' already exists.")
        else:
            print(f"Error adding column: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
