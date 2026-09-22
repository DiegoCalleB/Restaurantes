import asyncio
from playwright.async_api import async_playwright
import os
import urllib3
import requests

urllib3.disable_warnings()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True
        )
        page = await context.new_page()
        
        target_url = "https://www.instagram.com/stories/highlights/17844350480355846/"
        print("Opening instasaved.net...")
        await page.goto("https://instasaved.net/es/highlights", wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(2)
        
        # Look for input
        input_selector = "input[type='text'], input[placeholder*='Username'], input[name='link'], input[id='url']"
        inp = await page.wait_for_selector(input_selector, timeout=10000)
        if inp:
            print("Filling URL in instasaved...")
            await inp.fill(target_url)
            await page.keyboard.press("Enter")
            
            # Wait for results or download buttons
            await asyncio.sleep(8)
            
            os.makedirs("ig_output", exist_ok=True)
            await page.screenshot(path="ig_output/instasaved_result.png")
            
            # Find all download links / images
            imgs = await page.query_selector_all("img, a[download]")
            print(f"Found {len(imgs)} elements.")
            idx = 1
            for el in imgs:
                src = await el.get_attribute("src") or await el.get_attribute("href")
                if src and ("cdn" in src or "fbcdn" in src or "scontent" in src or "http" in src):
                    print(f"Result [{idx}]: {src[:120]}")
                    idx += 1
        else:
            print("Input selector not found.")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
