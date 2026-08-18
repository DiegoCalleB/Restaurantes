import os
from PIL import Image, ImageDraw, ImageFont
import random
from datetime import datetime, timedelta

def create_invoice(index, base_dir, invoice_date):
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color='white')
    d = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        font_bold = ImageFont.truetype("arialbd.ttf", 28)
        font_title = ImageFont.truetype("arialbd.ttf", 40)
    except IOError:
        font = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        font_title = ImageFont.load_default()

    proveedores = [
        ("Pescados y Mariscos La Marea", "Pescadería"),
        ("Carnicas El Chuletón", "Carnicería"),
        ("Frutas y Verduras La Huerta", "Frutería")
    ]
    
    # Productos necesarios para los escandallos
    # Tartar de Salmón: Salmón, Aguacate, Cebolla
    # Solomillo con Patatas: Solomillo Ternera, Patata
    
    productos_por_tipo = {
        "Pescadería": [("Salmón", 15.00, 20.00)],
        "Carnicería": [("Solomillo Ternera", 22.00, 28.00)],
        "Frutería": [("Aguacate", 4.50, 6.50), ("Cebolla", 1.00, 1.80), ("Patata", 0.80, 1.50)]
    }

    proveedor_idx = random.randint(0, len(proveedores)-1)
    prov_name, prov_tipo = proveedores[proveedor_idx]
    
    # Header
    d.text((50, 50), prov_name.upper(), fill='black', font=font_title)
    
    invoice_num = f"ALB-{random.randint(10000, 99999)}"
    
    d.text((500, 50), f"Albarán: {invoice_num}", fill='black', font=font_bold)
    d.text((500, 90), f"Fecha: {invoice_date.strftime('%d/%m/%Y')}", fill='black', font=font)
    
    # Table Header
    y = 200
    d.text((50, y), "Concepto", fill='black', font=font_bold)
    d.text((450, y), "Cant.(Kg)", fill='black', font=font_bold)
    d.text((550, y), "Precio/Kg", fill='black', font=font_bold)
    d.text((700, y), "Total", fill='black', font=font_bold)
    
    d.line([(50, y+35), (780, y+35)], fill='black', width=2)
    
    y += 60
    total = 0
    
    productos_disp = productos_por_tipo[prov_tipo]
    
    # Tomamos entre 1 y todos los productos disponibles del proveedor
    num_lines = random.randint(1, len(productos_disp))
    productos_seleccionados = random.sample(productos_disp, num_lines)
    
    for prod in productos_seleccionados:
        nombre_prod = prod[0]
        
        # Simular variación de precios según mercado
        precio = round(random.uniform(prod[1], prod[2]), 2)
        
        # Cantidades de compra realistas para restaurante
        if nombre_prod in ["Salmón", "Solomillo Ternera"]:
            cant = round(random.uniform(2.0, 10.0), 2)
        elif nombre_prod == "Patata":
            cant = round(random.uniform(10.0, 25.0), 2)
        else:
            cant = round(random.uniform(1.0, 5.0), 2)
            
        subtotal = round(precio * cant, 2)
        total += subtotal
        
        d.text((50, y), nombre_prod, fill='black', font=font)
        d.text((450, y), f"{cant:.2f}", fill='black', font=font)
        d.text((550, y), f"€{precio:.2f}", fill='black', font=font)
        d.text((700, y), f"€{subtotal:.2f}", fill='black', font=font)
        y += 40
        
    d.line([(50, y+20), (780, y+20)], fill='black', width=2)
    y += 40
    
    d.text((500, y), "TOTAL:", fill='black', font=font_title)
    d.text((700, y), f"€{total:.2f}", fill='red', font=font_title)
    
    # Guardar
    filename = f"albaran_{prov_name.replace(' ', '_').lower()}_{invoice_date.strftime('%Y%m%d')}_{invoice_num}.png"
    filepath = os.path.join(base_dir, filename)
    img.save(filepath)
    print(f"Generado: {filepath}")

if __name__ == '__main__':
    # Directorio base para el proyecto actual
    base_proj_dir = r"c:\Users\Diego.delaCalle\OneDrive - Kantar\Desarrollos_One_Drive\Matchings_Antigravity\old\AIronLabs\Restaurantes"
    out_dir = os.path.join(base_proj_dir, "albaranes_escandallos")
    os.makedirs(out_dir, exist_ok=True)

    # Generamos albaranes distribuidos en diferentes fechas (últimos 3 meses)
    num_albaranes = 15
    fecha_base = datetime.now() - timedelta(days=90)
    
    for i in range(num_albaranes):
        # Fecha aleatoria en los últimos 90 días
        dias_random = random.randint(0, 90)
        invoice_date = fecha_base + timedelta(days=dias_random)
        create_invoice(i, out_dir, invoice_date)

    print(f"\n¡Se han generado {num_albaranes} albaranes en la carpeta '{out_dir}'!")
