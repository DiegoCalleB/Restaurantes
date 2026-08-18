import os
from PIL import Image, ImageDraw, ImageFont
import random
from datetime import datetime, timedelta

def create_invoice(index, base_dir):
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color='white')
    d = ImageDraw.Draw(img)
    
    # Try to load a font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", 24)
        font_bold = ImageFont.truetype("arialbd.ttf", 28)
        font_title = ImageFont.truetype("arialbd.ttf", 40)
    except IOError:
        font = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        font_title = ImageFont.load_default()

    proveedores = [
        ("Carnicas El Chuletón", "Alimentación"),
        ("Distribuciones Paco", "Bebidas"),
        ("Limpiezas Brillante", "Limpieza"),
        ("Pescados del Puerto", "Alimentación"),
        ("Suministros Hosteleros Horeca", "Menaje"),
        ("Frutas y Verduras La Huerta", "Alimentación")
    ]
    
    productos_por_tipo = {
        "Alimentación": [("Solomillo Ternera", 22.50, 26.00), ("Cebolla", 1.20, 1.50), ("Tomate Pera", 1.80, 2.10), ("Salmón fresco", 15.00, 18.00)],
        "Bebidas": [("Barril Cerveza 50L", 65.00, 75.00), ("Coca Cola Caja", 18.00, 22.00), ("Vino Tinto Rioja", 4.50, 6.00)],
        "Limpieza": [("Lejía 5L", 3.00, 4.00), ("Desengrasante", 8.00, 10.00), ("Bolsas Basura", 2.50, 3.50)],
        "Menaje": [("Vasos Caña x100", 12.00, 14.00), ("Servilletas x500", 5.00, 6.50)]
    }

    proveedor_idx = random.randint(0, len(proveedores)-1)
    prov_name, prov_tipo = proveedores[proveedor_idx]
    
    # Header
    d.text((50, 50), prov_name.upper(), fill='black', font=font_title)
    
    invoice_num = f"INV-{random.randint(10000, 99999)}"
    invoice_date = (datetime.now() - timedelta(days=random.randint(1, 30))).strftime("%d/%m/%Y")
    
    d.text((500, 50), f"Factura: {invoice_num}", fill='black', font=font_bold)
    d.text((500, 90), f"Fecha: {invoice_date}", fill='black', font=font)
    
    # Table Header
    y = 200
    d.text((50, y), "Concepto", fill='black', font=font_bold)
    d.text((450, y), "Cant.", fill='black', font=font_bold)
    d.text((550, y), "Precio", fill='black', font=font_bold)
    d.text((650, y), "Total", fill='black', font=font_bold)
    
    d.line([(50, y+35), (750, y+35)], fill='black', width=2)
    
    y += 60
    total = 0
    
    # Generate 3 to 6 lines
    num_lines = random.randint(3, 6)
    
    # Probabilidad de generar un "sobreprecio" intencionado (20% por encima de lo normal)
    # Hacemos que algunos productos cuesten más de la media histórica.
    
    productos_disp = productos_por_tipo[prov_tipo]
    
    for _ in range(num_lines):
        prod = random.choice(productos_disp)
        nombre_prod = prod[0]
        
        # Generar un precio que a veces sea normal, y a veces con un sobreprecio brutal para probar las alertas
        if random.random() < 0.3:
            # 30% chance of extreme overprice
            precio = round(random.uniform(prod[2] * 1.3, prod[2] * 1.6), 2) 
        else:
            # Normal price
            precio = round(random.uniform(prod[1], prod[2]), 2)
            
        cant = random.randint(1, 10)
        subtotal = round(precio * cant, 2)
        total += subtotal
        
        d.text((50, y), nombre_prod, fill='black', font=font)
        d.text((450, y), str(cant), fill='black', font=font)
        d.text((550, y), f"€{precio:.2f}", fill='black', font=font)
        d.text((650, y), f"€{subtotal:.2f}", fill='black', font=font)
        y += 40
        
    d.line([(50, y+20), (750, y+20)], fill='black', width=2)
    y += 40
    
    d.text((450, y), "TOTAL:", fill='black', font=font_title)
    d.text((650, y), f"€{total:.2f}", fill='red', font=font_title)
    
    # Guardar
    filename = f"{prov_name.replace(' ', '_').lower()}_{invoice_num}.png"
    filepath = os.path.join(base_dir, filename)
    img.save(filepath)
    print(f"Generated: {filepath}")

out_dir = r"c:\Users\Diego.delaCalle\OneDrive - Kantar\Desarrollos_One_Drive\Matchings_Antigravity\old\AIronLabs\Restaurantes\ejemplos_albaranes_v2"
os.makedirs(out_dir, exist_ok=True)

for i in range(10):
    create_invoice(i, out_dir)
