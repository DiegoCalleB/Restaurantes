import os
import requests
import json
from dotenv import load_dotenv
import urllib3
urllib3.disable_warnings()

load_dotenv()
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Test updating column imagen_url for 1 plato
url = f"{supabase_url}/rest/v1/platos?id=eq.b16782e3-9468-4a05-a891-bda8f866effc"
resp = requests.patch(url, headers=headers, json={"imagen_url": "https://example.com/test.jpg"}, verify=False)
print("PATCH status:", resp.status_code)
print("PATCH response:", resp.text)
