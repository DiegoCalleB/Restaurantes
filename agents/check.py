import os
import requests
from dotenv import load_dotenv
import urllib3
urllib3.disable_warnings()

load_dotenv()
url = f"{os.getenv('SUPABASE_URL')}/rest/v1/restaurantes"
headers = {"apikey": os.getenv("SUPABASE_KEY")}
resp = requests.get(url, headers=headers, verify=False)
print(resp.text)
