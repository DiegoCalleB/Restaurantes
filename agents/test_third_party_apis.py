import requests
import urllib3
urllib3.disable_warnings()

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest"
}

highlight_url = "https://www.instagram.com/stories/highlights/17844350480355846/"

# 1. Test saveig.app
try:
    print("Testing saveig.app...")
    r = requests.post("https://api.v1.saveig.app/api/ajaxSearch", data={"q": highlight_url, "vt": "stories"}, headers=headers, verify=False, timeout=10)
    print("saveig status:", r.status_code)
    print("saveig text:", r.text[:300])
except Exception as e:
    print("saveig err:", e)

# 2. Test snapinsta.app
try:
    print("Testing snapinsta.app...")
    r = requests.post("https://snapinsta.app/action2.php", data={"url": highlight_url, "action": "post"}, headers=headers, verify=False, timeout=10)
    print("snapinsta status:", r.status_code)
    print("snapinsta text:", r.text[:300])
except Exception as e:
    print("snapinsta err:", e)

# 3. Test instasaved
try:
    print("Testing instasaved...")
    r = requests.get("https://instasaved.net/api/ig/highlights?url=" + highlight_url, headers=headers, verify=False, timeout=10)
    print("instasaved status:", r.status_code)
    print("instasaved text:", r.text[:300])
except Exception as e:
    print("instasaved err:", e)
