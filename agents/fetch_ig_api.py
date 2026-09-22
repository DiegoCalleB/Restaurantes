import requests
import json
import urllib3
urllib3.disable_warnings()

headers = {
    "User-Agent": "Instagram 219.0.0.12.117 Android (29/10; 480dpi; 1080x2280; Xiaomi; Redmi Note 8 Pro; begonia; qcom; es_ES; 344203649)",
    "Accept": "*/*",
    "Accept-Language": "es-ES,es;q=0.9",
    "X-IG-App-ID": "936619743392459"
}

highlight_id = "17844350480355846"
url = f"https://i.instagram.com/api/v1/feed/reels_media/?user_ids=highlight:{highlight_id}"

print(f"Querying Instagram mobile API for highlight {highlight_id}...")
resp = requests.get(url, headers=headers, verify=False)
print("Status:", resp.status_code)
print("Response text excerpt:", resp.text[:500])

if resp.status_code == 200:
    try:
        data = resp.json()
        print("Keys:", data.keys())
    except Exception as e:
        print("JSON parse error:", e)
