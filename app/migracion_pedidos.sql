-- 1. Tabla de Pedidos (Lo que el restaurante pide por teléfono/email)
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proveedor_id UUID REFERENCES proveedores(id),
  restaurante_id UUID REFERENCES restaurantes(id),
  fecha_pedido DATE DEFAULT CURRENT_DATE,
  fecha_entrega_esperada DATE,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recibido_parcial', 'recibido_total', 'cancelado')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Líneas de Pedido (Lo pactado)
CREATE TABLE IF NOT EXISTS lineas_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes_base(id),
  cantidad_pedida NUMERIC(10,2) NOT NULL,
  precio_pactado NUMERIC(10,2), -- Puede ser nulo si no se fijó precio
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Vincular Albarán con Pedido
ALTER TABLE albaranes
ADD COLUMN IF NOT EXISTS pedido_id UUID REFERENCES pedidos(id);

-- 4. Permisos RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_pedido ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_pedidos" ON pedidos;
DROP POLICY IF EXISTS "anon_all_lpedidos" ON lineas_pedido;

CREATE POLICY "anon_all_pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "anon_all_lpedidos" ON lineas_pedido FOR ALL USING (true);

-- 5. Insertar un pedido de prueba para el proveedor 1 (simulado)
-- Asumimos que existe un proveedor y un restaurante
INSERT INTO pedidos (proveedor_id, restaurante_id, fecha_pedido, estado)
SELECT p.id, r.id, CURRENT_DATE - INTERVAL '1 day', 'pendiente'
FROM proveedores p, restaurantes r
LIMIT 1;

-- Añadir líneas al pedido de prueba (Salmón y Aguacate)
INSERT INTO lineas_pedido (pedido_id, ingrediente_id, cantidad_pedida, precio_pactado)
SELECT ped.id, i.id, 10.0, 18.50
FROM pedidos ped, ingredientes_base i
WHERE i.nombre = 'Salmón' AND ped.estado = 'pendiente'
LIMIT 1;

INSERT INTO lineas_pedido (pedido_id, ingrediente_id, cantidad_pedida, precio_pactado)
SELECT ped.id, i.id, 5.0, 4.20
FROM pedidos ped, ingredientes_base i
WHERE i.nombre = 'Aguacate' AND ped.estado = 'pendiente'
LIMIT 1;
