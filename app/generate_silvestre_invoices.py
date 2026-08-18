import os
from PIL import Image, ImageDraw, ImageFont
import random
from datetime import datetime, timedelta

def create_invoice(index, base_dir, invoice_date):
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color='white')
    d = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 20)
        font_bold = ImageFont.truetype("arialbd.ttf", 22)
        font_title = ImageFont.truetype("arialbd.ttf", 34)
    except IOError:
        font = ImageFont.load_default()
        font_bold = ImageFont.load_default()
        font_title = ImageFont.load_default()

    proveedores = [
        ("Pescados y Mariscos La Marea", "Pescadería"),
        ("Carnicas El Chuletón", "Carnicería"),
        ("Frutas y Verduras La Huerta", "Frutería"),
        ("Lácteos y Huevos El Prado", "Lácteos"),
        ("Ultramarinos El Mundo", "Ultramarinos")
    ]
    
    productos_por_tipo = {
        "Pescadería": [
            ("Sardina ahumada", 18.00, 24.00), 
            ("Mejillones", 3.50, 5.50), 
            ("Atún fresco", 25.00, 35.00), 
            ("Calamar", 14.00, 19.00)
        ],
        "Carnicería": [
            ("Bacon", 7.00, 9.00), 
            ("Solomillo Ternera", 22.00, 30.00), 
            ("Panceta de cerdo", 6.50, 8.50), 
            ("Longaniza", 8.00, 12.00), 
            ("Rabo de ternera", 12.00, 16.00), 
            ("Carne picada ternera", 9.00, 13.00)
        ],
        "Frutería": [
            ("Patata", 0.80, 1.50), 
            ("Cebolla", 1.00, 1.80), 
            ("Setas variadas", 6.00, 10.00), 
            ("Endibias", 2.50, 4.00), 
            ("Mango", 3.00, 5.00), 
            ("Fresas", 4.00, 6.00), 
            ("Pimiento", 1.80, 2.80)
        ],
        "Lácteos": [
            ("Huevos (docena)", 1.80, 2.50), 
            ("Leche (L)", 0.80, 1.20), 
            ("Nata (L)", 3.50, 5.00), 
            ("Queso ahumado", 12.00, 16.00), 
            ("Queso cheddar", 8.00, 11.00), 
            ("Queso fresco", 6.00, 9.00)
        ],
        "Ultramarinos": [
            ("Ají amarillo (bote)", 4.00, 6.00), 
            ("Pan brioche (ud)", 0.60, 1.20), 
            ("Trufa negra (ud)", 20.00, 40.00), 
            ("Almendras", 14.00, 18.00), 
            ("Edamame", 3.00, 5.00), 
            ("Pasta curry verde", 4.50, 7.00), 
            ("Leche de coco (L)", 2.50, 4.00), 
            ("Arroz bomba", 2.20, 3.50), 
            ("Salsa hoisin (bote)", 3.00, 5.00), 
            ("Alga wakame", 12.00, 18.00), 
            ("Sésamo", 5.00, 8.00), 
            ("Fideos fideúa", 1.50, 2.50), 
            ("Pepinillos", 2.00, 3.50), 
            ("Azúcar", 1.00, 1.50)
        ]
    }

    proveedor_idx = random.randint(0, len(proveedores)-1)
    prov_name, prov_tipo = proveedores[proveedor_idx]
    
    # Header
    d.text((50, 50), prov_name.upper(), fill='black', font=font_title)
    
    invoice_num = f"ALB-{random.randint(100000, 999999)}"
    
    d.text((500, 50), f"Albarán: {invoice_num}", fill='black', font=font_bold)
    d.text((500, 90), f"Fecha: {invoice_date.strftime('%d/%m/%Y')}", fill='black', font=font)
    
    # Table Header
    y = 180
    d.text((50, y), "Concepto", fill='black', font=font_bold)
    d.text((450, y), "Cant.", fill='black', font=font_bold)
    d.text((550, y), "Precio", fill='black', font=font_bold)
    d.text((700, y), "Total", fill='black', font=font_bold)
    
    d.line([(50, y+30), (780, y+30)], fill='black', width=2)
    
    y += 50
    total = 0
    
    productos_disp = productos_por_tipo[prov_tipo]
    
    # Tomamos entre 2 y 6 productos (si hay suficientes)
    num_lines = random.randint(2, min(6, len(productos_disp)))
    productos_seleccionados = random.sample(productos_disp, num_lines)
    
    for prod in productos_seleccionados:
        nombre_prod = prod[0]
        
        # Simular variación de precios según mercado
        precio = round(random.uniform(prod[1], prod[2]), 2)
        
        # Cantidades de compra
        if nombre_prod in ["Trufa negra (ud)", "Ají amarillo (bote)", "Salsa hoisin (bote)", "Pan brioche (ud)", "Huevos (docena)"]:
            cant = float(random.randint(2, 20))
        elif nombre_prod in ["Patata", "Cebolla", "Carne picada ternera", "Solomillo Ternera", "Arroz bomba"]:
            cant = round(random.uniform(5.0, 20.0), 2)
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
    base_proj_dir = r"c:\Users\Diego.delaCalle\OneDrive - Kantar\Desarrollos_One_Drive\Matchings_Antigravity\old\AIronLabs\Restaurantes"
    out_dir = os.path.join(base_proj_dir, "albaranes_silvestre")
    os.makedirs(out_dir, exist_ok=True)

    # Generamos 20 albaranes para tener algo de volumen
    num_albaranes = 20
    fecha_base = datetime.now() - timedelta(days=90)
    
    for i in range(num_albaranes):
        dias_random = random.randint(0, 90)
        invoice_date = fecha_base + timedelta(days=dias_random)
        create_invoice(i, out_dir, invoice_date)

    print(f"\n¡Se han generado {num_albaranes} albaranes en la carpeta '{out_dir}'!")
