# Configuración y Conexión a Supabase

## Proyecto Supabase
- **URL Dashboard:** `https://supabase.com/dashboard/project/ctiwkdvoqcnkjmsxdfhx`
- **REST Endpoint:** `https://ctiwkdvoqcnkjmsxdfhx.supabase.co`

## Variables de Entorno

### Frontend (`/app/.env`)
```env
VITE_SUPABASE_URL="https://ctiwkdvoqcnkjmsxdfhx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_GEMINI_API_KEY="AIzaSy..."
```

### Agentes Python (`/agents/.env`)
```env
SUPABASE_URL="https://ctiwkdvoqcnkjmsxdfhx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
GEMINI_API_KEY="AQ.Ab8RN6..."
```

## Solución de Problemas en Redes Corporativas (Proxy Zscaler / Kantar SSL)
En entornos de red protegidos por proxy corporativo (como el entorno de Kantar), la verificación de certificados SSL puede fallar con `certificate verify failed`:

1. **Agentes Python**: Usar `urllib3.disable_warnings()` y pasar `verify=False` en peticiones con `requests` o configurar `SSL_CERT_FILE` adecuadamente en las variables de entorno.
2. **Frontend React**: `useAppData.js` cuenta con un timeout de 7 segundos que desactiva el spinner y muestra una advertencia sin bloquear la interacción del usuario.

## Despliegue de Esquema
Para sincronizar el esquema en una nueva instancia de Supabase:
1. Acceder al **SQL Editor** en el Dashboard de Supabase.
2. Copiar y ejecutar el contenido de [schema.sql](file:///c:/Users/Diego.delaCalle/OneDrive%20-%20Kantar/Desarrollos_One_Drive/Matchings_Antigravity/old/AIronLabs/Restaurantes/context/schema.sql).
