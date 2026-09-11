# Arquitectura del Sistema - Restaurantes (AIron Labs)

## Visión General
**Restaurantes** es un sistema SaaS B2C de gestión inteligente para restaurantes desarrollado por **AIron Labs**. Combina un dashboard React en tiempo real con una suite de agentes inteligentes asíncronos en Python respaldados por Supabase como backend relacional y almacén de datos.

```mermaid
graph TD
    A[Usuario / Restaurador] -->|Navegador| B[React 19 + Vite App]
    B -->|REST / Realtime| C[(Supabase BaaS)]
    B -->|Visión OCR / Prompting| D[Google Gemini AI API]
    
    subgraph Suite Agentes Background (Python)
        E[Scout Agent - Python/Playwright] -->|Polling Búsquedas| C
        F[Redactor Agent - Gemini LLM] -->|Generación Pitch| C
        G[Sender Agent - SMTP/API] -->|Envío Comunicados| C
        H[Scraper Cartas - Playwright/Gemini] -->|Extracción Menús| C
        I[Matcher Ingredientes - Fuzzy Matching] -->|Vinculación Albarán-Catálogo| C
    end
```

## Módulos Principales

### 1. Control de Albaranes e Incidencias (`/app/src/views/AlbaranesView.jsx`)
- Procesa albaranes mediante Gemini 2.5 Flash Multimodal OCR.
- Extrae proveedor, número de albarán, base imponible, desgloses de IVA y líneas de productos.
- Detecta variaciones desproporcionadas de precios respecto a compras anteriores.

### 2. Escandallos Vivos y Margen Dinámico (`/app/src/views/PlatosView.jsx`)
- Vincula líneas de albarán con la tabla `ingredientes_base`.
- Recalcula automáticamente el coste por ración y el porcentaje de margen sobre el precio de venta al público (PVP).
- Muestra alertas en tiempo real cuando la subida de precio de un ingrediente erosiona el margen recomendado (>70%).

### 3. Suite Agentes RRPP & Digitalización de Cartas (`/agents/`)
- **Scout Agent (`scout.py`)**: Localiza medios, blogs y críticos gastronómicos relevantes en DuckDuckGo y extrae correos con Playwright.
- **Redactor Agent (`redactor.py`)**: Redacta comunicados de prensa con Gemini según las reglas guardadas en `rrpp_memoria`.
- **Sender Agent (`sender.py`)**: Gestiona la aprobación y el envío de campañas de prensa.
- **Scraper Cartas Agent (`scraper_cartas.py`)**: Extrae menús web de competidores o proveedores y los transforma en estructura de escandallos.

## Principios de Buenas Prácticas con IA
1. **Verificación de Esquema Estricto**: Toda salida JSON de Gemini se valida contra esquemas definidos.
2. **Resiliencia & Fallbacks**: Manejo defensivo en llamadas a API con reintentos y tolerancia a certificaciones SSL corporativas (Kantar/Zscaler proxy).
3. **Persistencia Transparente**: Ningún proceso de IA guarda datos directamente sin poder ser auditado en las tablas de Supabase (`datos_raw`).
