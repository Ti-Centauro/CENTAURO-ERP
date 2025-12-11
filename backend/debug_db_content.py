import sqlite3
import os

files = ["centauro.db", "sql_app.db"]

for db_file in files:
    if os.path.exists(db_file):
        print(f"--- Checking {db_file} ---")
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # Check tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print(f"Tables: {[t[0] for t in tables]}")
            
            if ('collaborators',) in tables:
                cursor.execute("SELECT count(*) FROM collaborators")
                count = cursor.fetchone()[0]
                print(f"Count in 'collaborators': {count}")
                if count > 0:
                    cursor.execute("SELECT name FROM collaborators LIMIT 5")
                    rows = cursor.fetchall()
                    print(f"Sample data: {rows}")
            else:
                print("'collaborators' table NOT found.")
                
            conn.close()
        except Exception as e:
            print(f"Error reading {db_file}: {e}")
    else:
        print(f"--- {db_file} not found ---")
