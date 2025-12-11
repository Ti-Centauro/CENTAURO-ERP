import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    # Try finding .env manually if not loaded
    from dotenv import find_dotenv
    load_dotenv(find_dotenv())
    api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ API Key not found!")
    exit(1)

genai.configure(api_key=api_key)

print(f"Checking models with key: {api_key[:5]}...")

try:
    print("Available Models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
