import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        # Emulate iPhone 13 / Mobile Safari
        iphone = p.devices['iPhone 13 Pro']
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            **iphone,
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        media_found = []
        
        def handle_response(resp):
            u = resp.url
            if ("fbcdn" in u or "cdninstagram" in u or "scontent" in u) and any(ext in u for ext in [".jpg", ".heic", ".webp", ".mp4"]):
                media_found.append(u)
                
        page.on("response", handle_response)
        
        url = "https://www.instagram.com/stories/highlights/17844350480355846/"
        print("Opening Mobile Instagram Highlight URL:", url)
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await asyncio.sleep(5)
        except Exception as e:
            print("Error loading page:", e)
            
        print("Page Title:", await page.title())
        print("Final URL:", page.url)
        
        os.makedirs("ig_output", exist_ok=True)
        await page.screenshot(path="ig_output/mobile_ig.png")
        
        # Check html content
        content = await page.content()
        print("Content length:", len(content))
        with open("ig_output/mobile_dom.html", "w", encoding="utf-8") as f:
            f.write(content)
            
        print(f"Intercepted {len(media_found)} media URLs:")
        for m in media_found[:10]:
            print("-", m[:120])
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
