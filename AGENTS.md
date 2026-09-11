# AGENTS.md — Guía del Proyecto Restaurantes (AIron Labs)

## 📌 Visión General del Proyecto
**Restaurantes** es una plataforma web y sistema multiagente de gestión inteligente para restaurantes desarrollada por **AIron Labs**.
Combina una aplicación frontend interactiva (React 19 + Vite + Supabase) con una suite de agentes inteligentes asíncronos en Python (Playwright + Supabase REST + Gemini AI) para la gestión automática de albaranes OCR, escandallos vivos con rentabilidad dinámica, digitalización de cartas web y campañas automáticas de RRPP/Prensa.

---

## 📁 Estructura del Repositorio y Contexto

```
Restaurantes/
├── AGENTS.md                  # Guía principal de desarrollo e instrucciones para agentes de IA
├── package.json               # Configuración raíz para despliegue
├── context/                   # 🧠 CARPETA DE CONTEXTO TÉCNICO Y ESQUEMA
│   ├── schema.sql             # Esquema completo de Supabase (12 tablas relacionales)
│   ├── architecture.md        # Documentación de arquitectura y flujos de agentes
│   └── supabase_setup.md      # Guía de conexión, variables de entorno y soporte proxy SSL
├── agents/                    # Suite de Agentes Inteligentes en Python
│   ├── .env                   # Variables de entorno de agentes (Supabase, Gemini API)
│   ├── scout.py               # Agente 1: Búsqueda de medios de comunicación y contactos RRPP
│   ├── redactor.py            # Agente 2: Generador de notas de prensa y comunicados con LLM
│   ├── sender.py              # Agente 3: Gestión y envío de campañas RRPP
│   ├── scraper_cartas.py      # Agente 4: Extraedor automático de cartas y menús web
│   ├── matcher_ingredientes.py # Agente 5 (Propuesto): Fuzzy Matching albarán <-> catálogo
│   └── tests/                 # Suite de pruebas unitarias (Pytest)
├── app/                       # Aplicación Web React 19 + Vite (Dashboard)
│   ├── .env                   # Variables de entorno frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── supabaseClient.js  # Cliente Supabase
│       ├── geminiService.js   # Servicio OCR Multimodal y estructuración LLM
│       ├── useAppData.js      # Custom Hook de datos con Supabase
│       └── views/             # Vistas de la aplicación (Dashboard, Albaranes, Platos, etc.)
├── albaranes_escandallos/     # Archivos y datos de prueba para escandallos
└── albaranes_silvestre/       # Datos y pruebas específicas de albaranes
```

---

## 🛠️ Stack Tecnológico

### Frontend (`/app`)
- **Core:** React 19, Vite (Type: ES Module)
- **UI & Estilos:** Vanilla CSS / `App.css` (diseño premium, glassmorphism, temas oscuros elegantes)
- **Componentes & Iconos:** Lucide React (`lucide-react`), Recharts (`recharts`)
- **Backend as a Service:** Supabase Client (`@supabase/supabase-js`)
- **IA Frontend:** Google GenAI SDK (`@google/genai` / Gemini 2.5 Flash Multimodal)
- **Utilidades:** JSZip, FileSaver, XLSX

### Agentes Background (`/agents`)
- **Lenguaje:** Python 3.10+
- **Automatización Web:** Playwright (`playwright.async_api`)
- **Fuzzy Matching / Normalización:** `rapidfuzz` / `difflib` (mapeo de productos de albarán a ingredientes base)
- **Búsqueda & Web Scraping:** DuckDuckGo Search (`duckduckgo-search`), Requests
- **Base de datos:** Supabase Python SDK / REST API (`supabase-py`)
- **Entorno & Testing:** `python-dotenv`, `pytest`, `pytest-asyncio`

---

## 🤖 Suite de Agentes Background (`/agents`)

1. **Scout Agent (`agents/scout.py`):**
   - Consume órdenes de búsqueda desde Supabase (`rrpp_ordenes_busqueda`).
   - Busca en DuckDuckGo API y analiza las webs resultantes con Playwright para extraer correos de prensa.
   - Guarda los contactos en `rrpp_medios`.

2. **Redactor Agent (`agents/redactor.py`):**
   - Redacta notas de prensa personalizadas usando Gemini AI a partir de las directrices en `rrpp_memoria`.

3. **Sender Agent (`agents/sender.py`):**
   - Gestiona el estado de envío y aprobaciones de comunicados.

4. **Scraper Cartas Agent (`agents/scraper_cartas.py`):**
   - Automatiza la lectura y estructuración JSON de menús y cartas web de restaurantes mediante Playwright + LLM.

5. **Ingrediente Matcher Agent (`agents/matcher_ingredientes.py` - Propuesto):**
   - Procesa los productos escaneados en los albaranes y los asocia a `ingredientes_base` usando algoritmos de similitud de cadenas (*Fuzzy Matching*).

---

## 🔌 Integration Skills & MCPs Recomendados en Antigravity

Para maximizar la productividad y potencia de desarrollo con Antigravity en este proyecto, se recomiendan las siguientes herramientas y skills:

1. **`fullstack-dev` (Skill Activo):** Guía de desarrollo full-stack en Python, React y APIs REST para entornos Windows corporativos.
2. **Playwright / Browser Skill:** Permite al agente interactuar visualmente con el dashboard y probar los navegadores en vivo.
3. **Supabase / PostgreSQL MCP / CLI Skill:** Para ejecutar consultas, inspeccionar tipos de datos y aplicar migraciones SQL directamente.
4. **Data Normalization & Fuzzy Matching Skill:** Aplicación de algoritmos de coincidencia difusa para catálogos de hostelería y albaranes.

---

## 💡 Buenas Prácticas de Desarrollo e IA (Clean Code & Standardizing)

1. **Prompting Defensivo y Structured Outputs:**
   - Exigir siempre respuestas en JSON con esquema estricto (o Pydantic en Python / Zod en JS) al invocar Gemini para OCR de albaranes o parseo de cartas.
2. **Manejo Explícito de Excepciones y Logging:**
   - Evitar `try...except` vacíos. Capturar errores específicos (`requests.RequestException`, `playwright.async_api.Error`) y registrar logs descriptivos.
3. **Gestión de Recursos y Conexiones SSL:**
   - Usar siempre **Context Managers** (`async with`) para sesiones de Playwright y HTTP.
   - Manejar el bypass SSL (`verify=False`) de forma transparente en entornos con proxies corporativos (Kantar / Zscaler).
4. **Separación de Responsabilidades:**
   - Las vistas de React sólo deben renderizar la interfaz. Las consultas y transformaciones de datos deben estar centralizadas en `useAppData.js`, `supabaseClient.js` y `geminiService.js`.
5. **Persistencia Transparente en Supabase:**
   - Guardar siempre la respuesta JSON cruda (`datos_raw`) al procesar albaranes u ofertas para permitir auditorías y re-entrenamientos.

---

## 🧪 Estrategia de Testing y Calidad

### Framework Principal
- **Python (Agentes):** `pytest` + `pytest-asyncio` para pruebas asíncronas.

### Cobertura Prioritaria
1. **Fuzzy Matching de Ingredientes:** Testear que "Tomate Canario 5kg" se asocie correctamente a "Tomate".
2. **Parsing OCR de Albaranes:** Validar el cálculo de base imponible + desglose de IVA.
3. **Extracción y Sanitización de Emails (`agents/scout.py`):** Probar expresiones regulares y limpiado de URLs.

---

## 🚀 Comandos Principales

### Despliegue y Desarrollo Frontend
```bash
# Desarrollo local
cd app
npm run dev

# Compilar para producción
npm run build
```

### Ejecución de Agentes Python
```bash
cd agents
python scout.py
python scraper_cartas.py
```

### Ejecución de Tests
```bash
cd agents
pytest
```

---

## ⚠️ Reglas de Código (AIron Labs)

1. **Desarrollador Único:** Soluciones pragmáticas B2C, código limpio y mantenible por una sola persona.
2. **Gestión de Secretos:** NUNCA incluir API Keys ni tokens en el código; usar `.env`.
3. **Encoding Windows:** Detectar automáticamente el encoding (`chardet` / `cp1252` / `utf-8`) en archivos importados.
4. **Idioma:** Interfaz, comentarios y documentación siempre en **Español**.
