import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from matcher_ingredientes import limpiar_texto, calcular_similitud

def test_limpiar_texto_quita_medidas_y_caracteres():
    texto = "TOMATE CANARIO EXTRA 5KG!!!"
    limpio = limpiar_texto(texto)
    assert "5kg" not in limpio
    assert "extra" not in limpio
    assert "!" not in limpio
    assert "tomate canario" in limpio


def test_calcular_similitud_coincidencia_alta():
    # Caso 1: Nombre de producto en albarán vs ingrediente en catálogo maestro
    similitud = calcular_similitud("Tomate Canario 5kg", "Tomate")
    assert similitud >= 0.85


def test_calcular_similitud_solomillo():
    similitud = calcular_similitud("Solomillo de Ternera Gallega 1kg", "Solomillo de Ternera")
    assert similitud >= 0.80


def test_calcular_similitud_diferentes():
    similitud = calcular_similitud("Aceite de Oliva Virgen Extra 5L", "Harina de Trigo")
    assert similitud < 0.40
