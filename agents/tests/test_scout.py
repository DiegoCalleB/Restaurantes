import re
import pytest

def extraer_emails_de_texto(texto: str) -> list[str]:
    """
    Función helper pura para extraer y normalizar correos electrónicos de un texto.
    """
    if not texto:
        return []
    regex = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    coincidencias = re.findall(regex, texto)
    # Eliminar duplicados manteniendo el orden y convertir a minúsculas
    emails_limpios = []
    for email in coincidencias:
        email_clean = email.strip(".").lower()
        if email_clean not in emails_limpios:
            emails_limpios.append(email_clean)
    return emails_limpios


def test_extraer_emails_de_texto_exito():
    texto_prueba = "Puedes contactarnos en contacto@restaurantesilvestre.es o reservando@silvestre.com para dudas."
    resultado = extraer_emails_de_texto(texto_prueba)
    assert len(resultado) == 2
    assert "contacto@restaurantesilvestre.es" in resultado
    assert "reservando@silvestre.com" in resultado


def test_extraer_emails_de_texto_duplicados_y_mayusculas():
    texto_prueba = "Escribe a INFO@RESTAURANTE.COM o a info@restaurante.com."
    resultado = extraer_emails_de_texto(texto_prueba)
    assert resultado == ["info@restaurante.com"]


def test_extraer_emails_de_texto_vacio():
    assert extraer_emails_de_texto("") == []
    assert extraer_emails_de_texto(None) == []
