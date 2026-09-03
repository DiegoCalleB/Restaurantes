import os
import time
import requests
import urllib3
import json
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # Usamos la de agents/.env

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    print("Error: Faltan credenciales (Supabase o Gemini) en .env")
    exit(1)

def generar_pitch_gemini(medio_nombre, medio_tipo, medio_enfoque, nombre_restaurante):
    print(f"  🧠 Pensando el pitch para {medio_nombre} ({nombre_restaurante})...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={GEMINI_API_KEY}"
    
    contexto_extra = ""
    if "Mercado" in nombre_restaurante or "Tirso" in nombre_restaurante:
        contexto_extra = "Destaca el encanto de nuestro local ubicado dentro del vibrante Mercado de Tirso de Molina en pleno centro de Madrid, con un ambiente canalla y auténtico."
    elif "Becerril" in nombre_restaurante or "Sierra" in nombre_restaurante:
        contexto_extra = "Destaca nuestro local en la sierra de Madrid (Becerril de la Sierra), ideal para una escapada gastronómica y relajarse en un entorno único."
    
    prompt = f"""
    Eres el relaciones públicas experto de un restaurante innovador.
    Tu objetivo es redactar un email corto (máximo 150 palabras) a un medio de comunicación para que vengan a probar la comida y nos hagan un reportaje o reseña.
    
    Datos del Medio:
    - Nombre: {medio_nombre}
    - Tipo: {medio_tipo}
    - URL/Enfoque: {medio_enfoque}
    
    Datos del Restaurante:
    - Nombre: {nombre_restaurante}
    {contexto_extra}
    
    El tono debe ser: Fresco, respetuoso, directo y que invite a la acción. 
    Asegúrate de firmar como el equipo de {nombre_restaurante}.
    El email debe tener Asunto (en la primera línea) y Cuerpo.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7}
    }
    
    try:
        # Usamos verify=False para saltarnos el proxy de Kantar
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, verify=False)
        data = response.json()
        
        if "candidates" in data and len(data["candidates"]) > 0:
            texto = data["candidates"][0]["content"]["parts"][0]["text"]
            return texto.strip()
        else:
            print(f"  ⚠️ Error de Gemini: {data}")
            return None
    except Exception as e:
        print(f"  ⚠️ Error de conexión con Gemini: {e}")
        return None

def main():
    print("✍️ Iniciando Agente Redactor (Generador de Pitches)...")
    
    try:
        # 1. Obtener medios en estado 'Nuevo'
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/rrpp_medios?estado=eq.Nuevo",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            verify=False
        )
        
        if response.status_code != 200:
            print(f"⚠️ Error al obtener medios: {response.text}")
            return
            
        medios = response.json()
        
        if not medios:
            print("💤 No hay medios nuevos que necesiten pitch.")
            return
            
        print(f"🎯 Encontrados {len(medios)} medios para redactar.")
        # Obtener diccionario de restaurantes
        resp_rest = requests.get(
            f"{SUPABASE_URL}/rest/v1/restaurantes",
            headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
            verify=False
        )
        mapa_restaurantes = {}
        if resp_rest.status_code == 200:
            for r in resp_rest.json():
                mapa_restaurantes[r['id']] = r['nombre']
                
        for medio in medios:
            print(f"\n📝 Redactando para: {medio['nombre']}")
            
            # Determinar el nombre del restaurante (y contexto)
            rest_id = medio.get('restaurante_id')
            nombre_restaurante = mapa_restaurantes.get(rest_id, "Silvestre Vinos y Comidas")
            
            # Generar el texto
            pitch = generar_pitch_gemini(medio['nombre'], medio['tipo'], medio['enfoque_editorial'], nombre_restaurante)
            
            if pitch:
                # 2. Actualizar Supabase con el pitch y estado 'Pendiente_Aprobacion'
                patch_resp = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/rrpp_medios?id=eq.{medio['id']}",
                    headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "pitch_generado": pitch,
                        "estado": "Pendiente_Aprobacion"
                    },
                    verify=False
                )
                
                if patch_resp.status_code in (200, 204):
                    print("  ✅ Pitch guardado en Base de Datos (Estado: Pendiente_Aprobacion)")
                else:
                    print(f"  ⚠️ Error al guardar: {patch_resp.text}")
            
            time.sleep(2) # Respetar rate limits
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"⚠️ Error general: {e}")

if __name__ == "__main__":
    main()
