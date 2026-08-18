import os
import asyncio
import json
import requests
import urllib3
import re
from dotenv import load_dotenv
from supabase import create_client, Client
from playwright.async_api import async_playwright

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    print("Error: Faltan credenciales (Supabase o Gemini) en .env")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

async def extraer_html(url):
    print(f"🌐 Navegando a {url}...")
    async with async_playwright() as p:
        chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
        if not os.path.exists(chrome_path):
            chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
            
        browser = await p.chromium.launch(headless=True, executable_path=chrome_path)
        context = await browser.new_context()
        page = await context.new_page()
        try:
            await page.goto(url, timeout=30000)
            # Esperar un poco a que cargue el contenido dinámico
            await page.wait_for_timeout(3000)
            
            # Obtener el innerText para que sea más corto que el HTML
            texto = await page.evaluate('document.body.innerText')
            return texto
        except Exception as e:
            print(f"❌ Error al cargar {url}: {e}")
            return ""
        finally:
            await browser.close()

def parsear_carta_con_gemini(texto_web, nombre_restaurante):
    print(f"🤖 Pidiendo a Gemini que extraiga la carta de {nombre_restaurante}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
    Eres un experto extractor de datos. Te voy a pasar el texto extraído de la página web de un restaurante.
    Tu objetivo es encontrar todos los PLATOS de comida y sus PRECIOS de venta.
    (Ignora bebidas, vinos, cervezas o textos de relleno).
    
    Devuelve ÚNICAMENTE un JSON con el siguiente formato, sin markdown, sin ```json:
    [
      {{"nombre": "Nombre del plato 1", "precio_venta": 12.50}},
      {{"nombre": "Nombre del plato 2", "precio_venta": 8.00}}
    ]
    
    Aquí está el texto de la web:
    ---
    {texto_web[:25000]}  # Limitamos a 25000 caracteres por si acaso
    ---
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1}
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, verify=False)
        data = response.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            texto_respuesta = data["candidates"][0]["content"]["parts"][0]["text"]
            # Limpiar posible markdown
            texto_respuesta = texto_respuesta.replace("```json", "").replace("```", "").strip()
            
            try:
                platos = json.loads(texto_respuesta)
                print(f"✅ Se han extraído {len(platos)} platos.")
                return platos
            except json.JSONDecodeError:
                print(f"⚠️ Error al decodificar JSON de Gemini: {texto_respuesta}")
                return []
        else:
            print(f"⚠️ Error de Gemini: {data}")
            return []
    except Exception as e:
        print(f"⚠️ Error de conexión con Gemini: {e}")
        return []

def generar_escandallo_con_gemini(nombre_plato):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
    Eres un chef experto. Voy a darte el nombre de un plato y necesito que deduzcas cuáles son sus ingredientes principales (el escandallo).
    Limítate a un máximo de 5-6 ingredientes.
    
    Nombre del plato: {nombre_plato}
    
    Devuelve ÚNICAMENTE un JSON con este formato exacto, sin markdown:
    [
      {{"ingrediente": "Patata", "unidad": "kg", "cantidad": 0.3}},
      {{"ingrediente": "Aceite de oliva", "unidad": "L", "cantidad": 0.05}}
    ]
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3}
    }
    
    try:
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, verify=False)
        data = response.json()
        if "candidates" in data and len(data["candidates"]) > 0:
            texto = data["candidates"][0]["content"]["parts"][0]["text"]
            texto = texto.replace("```json", "").replace("```", "").strip()
            return json.loads(texto)
    except Exception as e:
        pass
    
    return []

async def procesar_restaurante_texto(restaurante_id, nombre, texto):
    print(f"\n{'='*50}\n🚀 Procesando restaurante: {nombre}\n{'='*50}")
    
    # 2. Parsear Platos con Gemini
    platos = parsear_carta_con_gemini(texto, nombre)
    if not platos: return
    
    print(f"👨‍🍳 Insertando {len(platos)} platos en Supabase...")
    
    for plato in platos:
        # Insertar Plato
        try:
            res_plato = requests.post(f"{SUPABASE_URL}/rest/v1/platos", headers=HEADERS, json={
                "nombre": plato["nombre"],
                "precio_venta": plato["precio_venta"],
                "restaurante_id": restaurante_id
            }, verify=False)
            
            if res_plato.status_code not in [200, 201]:
                continue
                
            plato_id = res_plato.json()[0]['id']
            print(f"  🍲 Plato guardado: {plato['nombre']}")
            
            # Generar Escandallo
            ingredientes = generar_escandallo_con_gemini(plato["nombre"])
            
            for ing in ingredientes:
                # Buscar o crear ingrediente base (ignoramos mayúsculas/minúsculas)
                ing_nombre = ing['ingrediente'].strip()
                
                # Buscar existente
                res_ing_get = requests.get(f"{SUPABASE_URL}/rest/v1/ingredientes_base?nombre=ilike.*{ing_nombre}*", headers=HEADERS, verify=False)
                ing_base_data = res_ing_get.json()
                
                ingrediente_id = None
                if ing_base_data and len(ing_base_data) > 0:
                    ingrediente_id = ing_base_data[0]['id']
                else:
                    # Crear nuevo
                    res_ing_post = requests.post(f"{SUPABASE_URL}/rest/v1/ingredientes_base", headers=HEADERS, json={
                        "nombre": ing_nombre,
                        "unidad_medida": ing['unidad']
                    }, verify=False)
                    if res_ing_post.status_code in [200, 201]:
                        ingrediente_id = res_ing_post.json()[0]['id']
                
                # Insertar en escandallos
                if ingrediente_id:
                    requests.post(f"{SUPABASE_URL}/rest/v1/escandallos", headers=HEADERS, json={
                        "plato_id": plato_id,
                        "ingrediente_id": ingrediente_id,
                        "cantidad": ing['cantidad']
                    }, verify=False)
                    
            await asyncio.sleep(1) # Rate limit Gemini
        except Exception as e:
            print(f"  ⚠️ Error guardando plato {plato['nombre']}: {e}")

async def main():
    tirso_id = '68d0128c-d047-48d4-8cbe-08fe151aa632'
    becerril_id = 'b7907314-f280-4ac8-bd3f-9bcac33ef35c'
    
    if tirso_id:
        try:
            with open(r"C:\Users\Diego.delaCalle\.gemini\antigravity\brain\050654e4-ab42-45df-8d08-05f7df0188c6\.system_generated\steps\470\content.md", "r", encoding="utf-8") as f:
                texto_tirso = f.read()
            # Limpiar un poco el texto para no exceder límites
            texto_tirso = texto_tirso[:100000]
            await procesar_restaurante_texto(tirso_id, "Silvestre Mercado Tirso de Molina", texto_tirso)
        except Exception as e:
            print(f"Error leyendo Tirso: {e}")
    
    pass
        
    print("\n✅ PROCESO COMPLETADO")

if __name__ == "__main__":
    asyncio.run(main())
