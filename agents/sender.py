import os
import time
import requests
import urllib3
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# Variables para enviar email (Ejemplo con Gmail/SMTP genérico)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Faltan credenciales de Supabase en .env")
    exit(1)

def enviar_email(destinatario, asunto, cuerpo):
    if not SMTP_USER or not SMTP_PASS:
        print(f"  [SIMULACIÓN] Enviando email a {destinatario}:\nAsunto: {asunto}\n{cuerpo}")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = destinatario
        msg['Subject'] = asunto
        msg.attach(MIMEText(cuerpo, 'plain'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"  ⚠️ Error al enviar email a {destinatario}: {e}")
        return False

def main():
    print("📨 Iniciando Agente Emisor (Enviador de Pitches)...")
    
    try:
        # 1. Obtener medios en estado 'Aprobado'
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/rrpp_medios?estado=eq.Aprobado",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            },
            verify=False
        )
        medios = response.json()
        
        if not medios:
            print("💤 No hay pitches aprobados pendientes de enviar.")
            return
            
        print(f"🎯 Encontrados {len(medios)} pitches aprobados listos para salir.")
        
        for medio in medios:
            print(f"\n🚀 Enviando a: {medio['nombre']} ({medio['contacto']})")
            
            # En la vida real, el primer renglón del pitch generado por Gemini suele ser el Asunto
            lineas = medio['pitch_generado'].split('\n')
            asunto = "Invitación exclusiva: Nueva experiencia gastronómica" # Fallback
            cuerpo = medio['pitch_generado']
            
            if lineas[0].lower().startswith("asunto:"):
                asunto = lineas[0].replace("Asunto:", "").replace("ASUNTO:", "").strip()
                cuerpo = "\n".join(lineas[1:]).strip()
            
            # Enviar el email
            exito = enviar_email(medio['contacto'], asunto, cuerpo)
            
            if exito:
                # 2. Actualizar Supabase a estado 'Enviado'
                patch_resp = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/rrpp_medios?id=eq.{medio['id']}",
                    headers={
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"estado": "Enviado"},
                    verify=False
                )
                
                if patch_resp.status_code in (200, 204):
                    print("  ✅ Marcado como 'Enviado' en Base de Datos")
                else:
                    print(f"  ⚠️ Error al actualizar DB: {patch_resp.text}")
            
            time.sleep(3) # Pausa amigable para no ser marcado como spam
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"⚠️ Error general: {e}")

if __name__ == "__main__":
    main()
