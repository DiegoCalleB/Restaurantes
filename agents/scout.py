import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from playwright.async_api import async_playwright

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

from duckduckgo_search import DDGS

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Faltan credenciales de Supabase en .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def buscar_en_google(page, query):
    print(f"🔍 Buscando: '{query}'")
    try:
        # Usamos la API de DuckDuckGo-search que nunca falla por captchas
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
            urls = [r['href'] for r in results if 'href' in r and not 'duckduckgo' in r['href']]
            return urls
    except Exception as e:
        print(f"  ⚠️ Error buscando en DuckDuckGo API: {e}")
        return []

async def extraer_contacto(page, url):
    print(f"  ➡️ Visitando: {url}")
    try:
        await page.goto(url, timeout=15000)
        # Buscar enlaces de mailto
        emails = await page.evaluate('''() => {
            const links = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
            return links.map(a => a.href.replace('mailto:', '').split('?')[0]);
        }''')
        
        # Opcional: Buscar texto que parezca email con regex en el body (simplificado)
        body_text = await page.evaluate('document.body.innerText')
        import re
        regex_emails = re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', body_text)
        
        todos_emails = list(set(emails + regex_emails))
        
        title = await page.title()
        
        return {
            "nombre": title.split('-')[0].strip(),
            "contacto": todos_emails[0] if todos_emails else None,
            "url": url
        }
    except Exception as e:
        print(f"  ❌ Error visitando {url}: {str(e)}")
        return None

async def main():
    print("🚀 Iniciando Agente Scout (Buscador de Medios)...")
    
    # Obtener órdenes pendientes usando requests
    import requests
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?estado=eq.Pendiente",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            verify=False
        )
        ordenes = response.json()
        if not ordenes:
            print("💤 No hay órdenes de búsqueda pendientes en la cola.")
            return
            
    except Exception as e:
        print(f"⚠️ Error al leer órdenes: {e}")
        return
        
    for orden in ordenes:
        query = orden["termino_busqueda"]
        print(f"\n🎯 Procesando orden: '{query}'")
        
        # Marcar como procesando
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?id=eq.{orden['id']}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            json={"estado": "Procesando"},
            verify=False
        )
        
        # 1. Buscar en DuckDuckGo API
        urls = await buscar_en_google(None, query)
        
        if not urls:
            print("  🤷‍♂️ No se encontraron URLs para esta búsqueda.")
            requests.patch(f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?id=eq.{orden['id']}", headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}, json={"estado": "Error"}, verify=False)
            continue
            
        # 2. Visitar cada web y extraer contacto con Playwright
        async with async_playwright() as p:
            import os
            chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
            if not os.path.exists(chrome_path):
                chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
                
            browser = await p.chromium.launch(headless=True, executable_path=chrome_path)
            context = await browser.new_context()
            page = await context.new_page()
            
            for url in urls:
                datos = await extraer_contacto(page, url)
                
                if datos and datos["contacto"]:
                    print(f"  ✅ Encontrado: {datos['nombre']} -> {datos['contacto']}")
                    
                    try:
                        resp = requests.post(
                            f"{SUPABASE_URL}/rest/v1/rrpp_medios",
                            headers={
                                "apikey": SUPABASE_KEY,
                                "Authorization": f"Bearer {SUPABASE_KEY}",
                                "Content-Type": "application/json",
                                "Prefer": "return=minimal"
                            },
                            json={
                                "restaurante_id": orden.get("restaurante_id"),
                                "nombre": datos["nombre"],
                                "contacto": datos["contacto"],
                                "tipo": "Prensa/Web", 
                                "alcance": "Desconocido",
                                "enfoque_editorial": datos["url"]
                            },
                            verify=False
                        )
                        if resp.status_code in (200, 201, 204):
                            print("  💾 Guardado en base de datos.")
                        else:
                            print(f"  ⚠️ Error de base de datos: {resp.text}")
                    except Exception as e:
                        print(f"  ⚠️ Error al guardar: {str(e)}")
                            
                await asyncio.sleep(2) # Pausa amigable
                
            await browser.close()
            
        # Marcar como Completado
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?id=eq.{orden['id']}",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            },
            json={"estado": "Completado"},
            verify=False
        )

    print("\n✨ Todas las búsquedas finalizadas.")

if __name__ == "__main__":
    asyncio.run(main())
