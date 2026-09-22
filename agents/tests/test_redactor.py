import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest

def estructurar_nota_prensa_fallback(titulo_evento: str, restaurante_nombre: str) -> dict:
    """
    Función de respaldo estructurada para notas de prensa cuando no hay API Key o falla el LLM.
    """
    if not titulo_evento or not restaurante_nombre:
        raise ValueError("Se requiere título del evento y nombre del restaurante")

    return {
        "titular": f"ÚLTIMA HORA: {titulo_evento} en {restaurante_nombre}",
        "subtitulo": f"{restaurante_nombre} presenta su nueva propuesta gastronómica en Madrid.",
        "cuerpo": f"El reconocido espacio gastronómico {restaurante_nombre} ha anunciado hoy la celebración de {titulo_evento}.",
        "contacto_prensa": f"prensa@{restaurante_nombre.lower().replace(' ', '')}.com"
    }


def test_estructurar_nota_prensa_fallback_valida():
    resultado = estructurar_nota_prensa_fallback("Menú Degustación Otoño", "Silvestre Vinos y Comidas")
    assert "ÚLTIMA HORA" in resultado["titular"]
    assert "Silvestre Vinos y Comidas" in resultado["subtitulo"]
    assert resultado["contacto_prensa"] == "prensa@silvestrevinosycomidas.com"


def test_estructurar_nota_prensa_error_parametros():
    with pytest.raises(ValueError):
        estructurar_nota_prensa_fallback("", "Silvestre")
