import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # Launch chromium browser
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()
        
        media_urls = []
        
        # Intercept network responses for images/videos
        def handle_response(response):
            url = response.url
            if any(ext in url for ext in [".jpg", ".heic", ".webp", ".mp4"]) and ("instagram" in url or "fbcdn" in url or "cdninstagram" in url):
                media_urls.append((response.request.resource_type, url))
        
        page.on("response", handle_response)
        
        print("Navigating to Instagram Highlight...")
        url = "https://www.instagram.com/stories/highlights/17844350480355846/"
        await page.goto(url, wait_until="networkidle", timeout=30000)
        
        await asyncio.sleep(5)
        print("Page title:", await page.title())
        print("Page URL:", page.url)
        
        os.makedirs("ig_output", exist_ok=True)
        await page.screenshot(path="ig_output/page_screenshot.png")
        
        print(f"Captured {len(media_urls)} media URLs.")
        for rtype, murl in media_urls[:20]:
            print(f"[{rtype}] {murl[:100]}")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
