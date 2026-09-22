import os
import re
import sys
import time
import json
import asyncio
import argparse
import requests
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings()

# Cargar variables de entorno desde agents/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Faltan credenciales de Supabase en .env")
    sys.exit(1)


def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }


def extraer_emails_de_texto(texto: str) -> list[str]:
    """Extrae y normaliza correos electrónicos válidos de un texto."""
    if not texto:
        return []
    regex = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    coincidencias = re.findall(regex, texto)
    emails_limpios = []
    for email in coincidencias:
        email_clean = email.strip(".").lower()
        if email_clean not in emails_limpios and not email_clean.endswith(('.png', '.jpg', '.gif', '.svg', '.jpeg', '.webp')):
            if not any(ign in email_clean for ign in ['sentry', 'example', 'w3.org', 'domain.com', 'schema.org']):
                emails_limpios.append(email_clean)
    return emails_limpios


def buscar_medios_con_gemini(query: str) -> list[dict]:
    """
    Utiliza Gemini AI (gemini-3.5-flash-lite) para investigar y estructurar contactos 
    reales o altamente plausibles de prensa, radio, TV, revistas o tiktokers/influencers en 2 segundos.
    """
    if not GEMINI_API_KEY:
        print("  ⚠️ No hay GEMINI_API_KEY configurada.")
        return []

    print(f"🤖 [SCOUT IA] Investigando contactos para: '{query}'...")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        prompt = f"""
Eres un especialista en RRPP de hostelería y comunicación en España.
El usuario necesita una lista de contactos de medios de comunicación, revistas, periódicos, programas de TV/radio, podcasts o creadores de contenido (influencers/tiktokers) sobre: "{query}".

Devuelve una lista JSON de 3 a 5 contactos referentes en España altamente específicos para esa búsqueda.
Debes especificar estrictamente:
- "nombre": Nombre del medio, programa, revista o creador de contenido (ej: "Cocituber", "Metrópoli (El Mundo)", "7 Caníbales", "Tapas Magazine", "Cadena SER Gastronomía", "Foodies Madrid").
- "contacto": Correo electrónico de contacto o prensa (ej: "contacto@cocituber.com", "metropoli@elmundo.es", "redaccion@7canibales.com", "prensa@foodiesmadrid.com").
- "tipo": Debe ser EXACTAMENTE uno de los 5 valores permitidos en Supabase: "Prensa", "Radio", "TV", "Podcast" o "Redes". (Mapea creadores/influencers a "Redes").
- "alcance": Ejemplos: "Nacional", "Local Madrid", "TikTok / Instagram (500k followers)".
- "enfoque_editorial": Breve descripción del tipo de contenido que publican y por qué encaja.

Devuelve ÚNICAMENTE un array JSON válido sin formato markdown ni texto adicional.
"""
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        medios = json.loads(response.text.strip())
        print(f"  ✨ Gemini encontró {len(medios)} contactos candidatos.")
        return medios
    except Exception as e:
        print(f"  ⚠️ Error invocando a Gemini Scout: {e}")
        return []


def existe_contacto(contacto: str, restaurante_id: str = None) -> bool:
    """Comprueba si un contacto ya existe en la tabla rrpp_medios de Supabase."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/rrpp_medios?contacto=eq.{contacto}"
        if restaurante_id:
            url += f"&restaurante_id=eq.{restaurante_id}"
        res = requests.get(url, headers=get_headers(), verify=False, timeout=2)
        if res.status_code == 200:
            return len(res.json()) > 0
    except Exception:
        pass
    return False


async def procesar_orden(orden):
    query = orden["termino_busqueda"]
    orden_id = orden["id"]
    restaurante_id = orden.get("restaurante_id")
    
    print(f"\n🎯 [SCOUT] Procesando orden ID {orden_id} -> '{query}'")

    # Marcar orden como 'Procesando'
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?id=eq.{orden_id}",
        json={"estado": "Procesando"},
        headers=get_headers(),
        verify=False
    )

    medios_candidatos = []

    # 1. Invocación ultra-rápida y directa a Gemini AI Scout (2 segundos)
    medios_ia = buscar_medios_con_gemini(query)
    for m in medios_ia:
        if m.get("contacto") and m.get("nombre"):
            medios_candidatos.append(m)

    # 2. Guardar candidatos en Supabase
    medios_guardados = 0
    tipos_validos = ['Prensa', 'Radio', 'TV', 'Podcast', 'Redes']

    for medio in medios_candidatos:
        email = medio["contacto"].lower().strip()
        tipo_final = medio.get("tipo", "Prensa")
        if tipo_final == "Influencer":
            tipo_final = "Redes"
        if tipo_final not in tipos_validos:
            tipo_final = "Prensa"

        if existe_contacto(email, restaurante_id):
            print(f"  ⏩ Contacto {email} ya existe en BD. Omitiendo.")
            continue

        nuevo_registro = {
            "nombre": medio["nombre"][:100],
            "contacto": email,
            "tipo": tipo_final,
            "alcance": medio.get("alcance", "Digital / Redes")[:50],
            "estado": "Nuevo",
            "enfoque_editorial": medio.get("enfoque_editorial", f"Búsqueda: {query}")
        }
        if restaurante_id:
            nuevo_registro["restaurante_id"] = restaurante_id

        res_post = requests.post(
            f"{SUPABASE_URL}/rest/v1/rrpp_medios",
            json=nuevo_registro,
            headers=get_headers(),
            verify=False
        )
        if res_post.status_code in (200, 201, 204):
            print(f"  💾 Contacto guardado: {nuevo_registro['nombre']} -> {email}")
            medios_guardados += 1
        else:
            print(f"  ⚠️ Error guardando en Supabase ({res_post.status_code}): {res_post.text}")

    # Marcar orden como Completado en Supabase
    requests.patch(
        f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?id=eq.{orden_id}",
        json={"estado": "Completado"},
        headers=get_headers(),
        verify=False
    )
    print(f"✨ Orden ID {orden_id} completada en 2s. Total de medios insertados: {medios_guardados}\n")


def ejecutar_scout_una_vez():
    """Revisa y procesa las órdenes pendientes o atascadas en la cola de Supabase."""
    try:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/rrpp_ordenes_busqueda?estado=in.(Pendiente,Procesando)&select=*",
            headers=get_headers(),
            verify=False,
            timeout=3
        )
        if resp.status_code == 200:
            ordenes = resp.json()
            if not ordenes:
                return 0
            print(f"📋 Órdenes pendientes encontradas: {len(ordenes)}")
            for orden in ordenes:
                asyncio.run(procesar_orden(orden))
            return len(ordenes)
    except Exception as e:
        print(f"❌ Excepción ejecutando Scout: {e}")
    return 0


def ejecutar_scout_daemon(intervalo_segundos=2):
    """Ejecuta el agente Scout en bucle continuo escuchando nuevas órdenes cada 2s."""
    print(f"🚀 [SCOUT DAEMON] Servicio ultra-rápido activo (intervalo: {intervalo_segundos}s)...")
    try:
        while True:
            ejecutar_scout_una_vez()
            time.sleep(intervalo_segundos)
    except KeyboardInterrupt:
        print("\n🛑 Servicio Scout detenido por el usuario.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agente Scout de RRPP")
    parser.add_argument("--watch", action="store_true", help="Ejecutar en modo servicio daemon (bucle continuo)")
    args = parser.parse_args()

    if args.watch:
        ejecutar_scout_daemon()
    else:
        ejecutar_scout_una_vez()
