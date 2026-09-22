import os
import requests
import json
from dotenv import load_dotenv
import urllib3
urllib3.disable_warnings()

load_dotenv()
url = f"{os.getenv('SUPABASE_URL')}/rest/v1/platos?select=*"
headers = {"apikey": os.getenv("SUPABASE_KEY")}
resp = requests.get(url, headers=headers, verify=False)
platos = resp.json()
print(f"Total platos encontrados: {len(platos)}")
for p in platos:
    print(p)
