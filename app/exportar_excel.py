import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargamos tu archivo .env que ya tiene las credenciales (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("No se encontraron las variables de Supabase en tu .env. Revisa el archivo.")

# Inicializamos el cliente de Supabase
supabase: Client = create_client(url, key)

def export_to_excel():
    print("Conectando a Supabase para extraer datos...")
    
    try:
        # Hacemos las llamadas a la API de Supabase para bajar el contenido entero de cada tabla
        response_restaurantes = supabase.table("restaurantes").select("*").execute()
        response_proveedores = supabase.table("proveedores").select("*").execute()
        response_albaranes = supabase.table("albaranes").select("*").execute()
        response_lineas = supabase.table("lineas_albaran").select("*").execute()
    except Exception as e:
        print(f"Error al conectar con Supabase: {e}")
        return

    # Convertimos los JSON de respuesta a los amados DataFrames de pandas
    df_rest = pd.DataFrame(response_restaurantes.data)
    df_prov = pd.DataFrame(response_proveedores.data)
    df_alb = pd.DataFrame(response_albaranes.data)
    df_lin = pd.DataFrame(response_lineas.data)
    
    if df_alb.empty:
        print("La base de datos está vacía, no hay albaranes que exportar.")
        return
        
    print(f"Extraídos {len(df_alb)} albaranes y {len(df_lin)} líneas. Generando Excel...")

    # Lo volcamos todo en un único archivo, con una pestaña (hoja) por cada tabla
    output_file = "exportacion_albaranes.xlsx"
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        if not df_rest.empty:
            df_rest.to_excel(writer, sheet_name="Restaurantes", index=False)
        if not df_prov.empty:
            df_prov.to_excel(writer, sheet_name="Proveedores", index=False)
        if not df_alb.empty:
            # Podemos quitar los campos 'datos_raw' si molestan en el excel (opcional)
            df_alb.to_excel(writer, sheet_name="Albaranes", index=False)
        if not df_lin.empty:
            df_lin.to_excel(writer, sheet_name="Lineas Albaran", index=False)
        
    print(f"¡Exportación completada con éxito! Archivo guardado como: {output_file}")

if __name__ == "__main__":
    export_to_excel()
