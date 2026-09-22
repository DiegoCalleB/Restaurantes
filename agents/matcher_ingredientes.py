import os
import re
import requests
from difflib import SequenceMatcher
from dotenv import load_dotenv

# Cargar variables de entorno de agentes/.env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Desactivar advertencias SSL en entornos corporativos (Kantar / Zscaler Proxy)
import urllib3
urllib3.disable_warnings()


def get_headers():
    return {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY or ''}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def limpiar_texto(texto: str) -> str:
    """
    Limpia y normaliza el texto de un producto de albarán eliminando
    tildes, medidas, cantidades y caracteres especiales.
    """
    if not texto or not isinstance(texto, str):
        return ""
    
    # Minúsculas y quitar tildes
    texto = texto.lower()
    remplazos = {'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u'}
    for orig, dest in remplazos.items():
        texto = texto.replace(orig, dest)

    # Eliminar unidades de medida comunes, empaquetados y palabras de relleno
    patrones = [
        r'\b\d+([.,]\d+)?\s*(kg|g|gr|l|ml|cl|unid|ud|uds|caja|cajas|pack|botella|botellas|bolsa|bolsas|lata|latas|saco)\b',
        r'\b(extra|super|primera|1a|2a|calidad|fresco|congelado|importacion|nacional|pack|oferta)\b',
        r'[^\w\s]'
    ]
    for pat in patrones:
        texto = re.sub(pat, ' ', texto)

    return " ".join(texto.split())


def calcular_similitud(prod_albaran: str, ingrediente_base: str) -> float:
    """
    Calcula la puntuación de similitud entre 0.0 y 1.0 utilizando el algoritmo
    SequenceMatcher (basado en difflib / Levenshtein modificado) y análisis de tokens.
    """
    norm_albaran = limpiar_texto(prod_albaran)
    norm_ingrediente = limpiar_texto(ingrediente_base)

    if not norm_albaran or not norm_ingrediente:
        return 0.0

    # 1. Coincidencia exacta tras normalizado
    if norm_albaran == norm_ingrediente:
        return 1.0

    # 2. Coincidencia por conjunto de palabras (Token Set Ratio)
    words_ingr = set(norm_ingrediente.split())
    words_alb = set(norm_albaran.split())

    if words_ingr and words_ingr.issubset(words_alb):
        return 0.92

    if words_alb and words_alb.issubset(words_ingr):
        return 0.88

    # 3. SequenceMatcher Ratio (difflib)
    matcher = SequenceMatcher(None, norm_albaran, norm_ingrediente)
    ratio = matcher.ratio()

    # Bonus si comparten la raíz de palabras significativas (excluyendo stopwords)
    stopwords = {'de', 'del', 'el', 'la', 'los', 'las', 'en', 'con', 'para', 'a', 'y', 'un', 'una', 'por'}
    words_ingr_sig = {w for w in words_ingr if w not in stopwords and len(w) > 2}
    words_alb_sig = {w for w in words_alb if w not in stopwords and len(w) > 2}

    common_words = words_ingr_sig.intersection(words_alb_sig)
    if common_words:
        ratio = max(ratio, 0.70 + (len(common_words) * 0.10))

    return round(min(1.0, ratio), 2)


def obtener_ingredientes_base():
    """Obtiene la lista completa de ingredientes base registrados en Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[WARN] SUPABASE_URL o SUPABASE_KEY no configurados.")
        return []

    url = f"{SUPABASE_URL}/rest/v1/ingredientes_base?select=id,nombre,unidad_medida,precio_estimado"
    try:
        res = requests.get(url, headers=get_headers(), verify=False, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"[ERROR] Error al consultar ingredientes_base: {e}")
    return []


def obtener_lineas_sin_vincular():
    """Obtiene las líneas de albarán que aún no tienen ingrediente_base_id asignado."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    url = f"{SUPABASE_URL}/rest/v1/lineas_albaran?ingrediente_base_id=is.null&select=id,albaran_id,producto,cantidad,precio_unitario"
    try:
        res = requests.get(url, headers=get_headers(), verify=False, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"[ERROR] Error al consultar lineas_albaran sin vincular: {e}")
    return []


def vincular_linea_con_ingrediente(linea_id: str, ingrediente_id: str, nuevo_precio: float = None):
    """Asocia la línea de albarán al ingrediente base y actualiza el precio de referencia."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False

    url_linea = f"{SUPABASE_URL}/rest/v1/lineas_albaran?id=eq.{linea_id}"
    body = {"ingrediente_base_id": ingrediente_id}
    
    try:
        res = requests.patch(url_linea, json=body, headers=get_headers(), verify=False, timeout=10)
        if res.status_code in (200, 204):
            print(f"[SUCCESS] Línea {linea_id} vinculada al ingrediente {ingrediente_id}")
            
            # Si viene un precio nuevo de albarán, actualizar el precio estimado del ingrediente maestro
            if nuevo_precio and nuevo_precio > 0:
                url_ingr = f"{SUPABASE_URL}/rest/v1/ingredientes_base?id=eq.{ingrediente_id}"
                requests.patch(url_ingr, json={"precio_estimado": nuevo_precio}, headers=get_headers(), verify=False, timeout=10)
            return True
    except Exception as e:
        print(f"[ERROR] No se pudo vincular la línea {linea_id}: {e}")
    return False


def ejecutar_matching_agente(umbral_similitud: float = 0.65):
    """
    Bucle principal del Agente Matcher de Ingredientes.
    Procesa todas las líneas de albarán pendientes de vincular.
    """
    print("--- INICIANDO AGENTE DE FUZZY MATCHING DE INGREDIENTES ---")
    ingredientes = obtener_ingredientes_base()
    lineas = obtener_lineas_sin_vincular()

    print(f"-> Ingredientes base en catálogo: {len(ingredientes)}")
    print(f"-> Líneas de albarán sin vincular: {len(lineas)}")

    if not ingredientes or not lineas:
        print("-> Nada que procesar. Finalizando agente.")
        return 0

    vinculados = 0
    for linea in lineas:
        producto_nombre = linea.get("producto", "")
        mejor_match = None
        mejor_score = 0.0

        for ing in ingredientes:
            score = calcular_similitud(producto_nombre, ing["nombre"])
            if score > mejor_score:
                mejor_score = score
                mejor_match = ing

        print(f"Producto: '{producto_nombre}' -> Candidato: '{mejor_match['nombre'] if mejor_match else 'Ninguno'}' (Similitud: {mejor_score:.2f})")

        if mejor_match and mejor_score >= umbral_similitud:
            exito = vincular_linea_con_ingrediente(
                linea_id=linea["id"],
                ingrediente_id=mejor_match["id"],
                nuevo_precio=linea.get("precio_unitario")
            )
            if exito:
                vinculados += 1

    print(f"--- MATCHING FINALIZADO: {vinculados} líneas vinculadas exitosamente ---")
    return vinculados


if __name__ == "__main__":
    ejecutar_matching_agente()
