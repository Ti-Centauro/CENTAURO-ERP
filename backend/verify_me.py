import requests

def verify_me():
    base_url = "http://127.0.0.1:8000"
    login_data = {"username": "lucas.silva@centauro.com.br", "password": "senha123"}
    
    print(f"Logging in as {login_data['username']}...")
    try:
        res = requests.post(f"{base_url}/login", data=login_data)
        if res.status_code != 200:
            print(f"Login failed: {res.status_code} {res.text}")
            return
        
        token = res.json()["access_token"]
        print("Login successful. Token obtained.")
        
        headers = {"Authorization": f"Bearer {token}"}
        me_res = requests.get(f"{base_url}/me", headers=headers)
        
        if me_res.status_code == 200:
            data = me_res.json()
            print("\n--- /me Response ---")
            print(f"ID: {data.get('id')}")
            print(f"Email: {data.get('email')}")
            print(f"Role: {data.get('role')}")
            print(f"Collaborator ID: {data.get('collaborator_id')}")
            print(f"Permissions: {data.get('permissions')}")
            
            perms = data.get('permissions', {})
            fleet_perms = perms.get('fleet', [])
            print(f"\nFleet Permissions: {fleet_perms}")
            
            if 'edit' in fleet_perms or 'write' in fleet_perms:
                 print("✅ Fleet Edit/Write Permission FOUND.")
            else:
                 print("❌ Fleet Edit/Write Permission NOT found.")

        else:
            print(f"/me failed: {me_res.status_code} {me_res.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_me()
