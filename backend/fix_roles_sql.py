import sqlite3
import os

def fix_collaborator_roles():
    db_path = "centauro.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if roles table has entries
        cursor.execute("SELECT id, name FROM roles")
        roles = cursor.fetchall()
        print(f"Found {len(roles)} roles.")
        
        # Update query
        # SQLite supports this type of update? 
        # UPDATE collaborators SET role_id = (SELECT id FROM roles WHERE roles.name = collaborators.role) WHERE role_id IS NULL AND role IS NOT NULL;
        
        cursor.execute("""
            UPDATE collaborators 
            SET role_id = (
                SELECT id FROM roles 
                WHERE roles.name = collaborators.role
            ) 
            WHERE role_id IS NULL AND role IS NOT NULL
        """)
        
        updated_rows = cursor.rowcount
        conn.commit()
        print(f"Updated {updated_rows} collaborators.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_collaborator_roles()
