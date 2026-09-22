import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # Launch Chromium with ignore_https_errors=True for corporate proxy
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        media_urls = set()
        
        def handle_response(response):
            url = response.url
            if ("cdninstagram" in url or "fbcdn" in url or "instagram" in url) and any(ext in url for ext in [".jpg", ".webp", ".mp4"]):
                media_urls.add(url)
        
        page.on("response", handle_response)
        
        url = "https://www.instagram.com/stories/highlights/17844350480355846/"
        print(f"Navigating to {url}...")
        
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await asyncio.sleep(6)
        except Exception as e:
            print("Goto error:", e)
            
        print("Page Title:", await page.title())
        print("Current URL:", page.url)
        
        os.makedirs("ig_output", exist_ok=True)
        await page.screenshot(path="ig_output/page_dom.png")
        
        # Check all img tags
        images = await page.query_selector_all("img")
        print(f"Found {len(images)} img elements.")
        for img in images:
            src = await img.get_attribute("src")
            alt = await img.get_attribute("alt")
            if src:
                print(f"IMG src: {src[:120]} | alt: {alt}")
                
        print(f"Total media URLs intercepted: {len(media_urls)}")
        for m in list(media_urls)[:10]:
            print("Media:", m[:120])
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
