-- 1. Catálogo Maestro de Ingredientes
-- Aquí normalizamos lo que nos traen los proveedores
CREATE TABLE ingredientes_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  unidad_medida TEXT DEFAULT 'kg', -- kg, litro, unidad
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Platos (Carta del restaurante)
CREATE TABLE platos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_venta NUMERIC(10,2) NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Escandallos (Recetas)
-- Relaciona el plato con sus ingredientes
CREATE TABLE escandallos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plato_id UUID REFERENCES platos(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes_base(id),
  cantidad NUMERIC(10,3) NOT NULL, -- Cantidad requerida (en la unidad_medida del ingrediente)
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Modificar lineas_albaran para enlazarlas al catálogo maestro
ALTER TABLE lineas_albaran
ADD COLUMN ingrediente_base_id UUID REFERENCES ingredientes_base(id);

-- Políticas RLS rápidas
ALTER TABLE ingredientes_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escandallos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_ingredientes" ON ingredientes_base FOR ALL USING (true);
CREATE POLICY "anon_platos" ON platos FOR ALL USING (true);
CREATE POLICY "anon_escandallos" ON escandallos FOR ALL USING (true);

-- Insertar Datos Semilla para poder probar
INSERT INTO ingredientes_base (nombre, unidad_medida) VALUES 
('Salmón', 'kg'),
('Aguacate', 'kg'),
('Cebolla', 'kg'),
('Salsa Soja', 'litro'),
('Solomillo Ternera', 'kg'),
('Patata', 'kg'),
('Pan de Hamburguesa', 'unidad');

-- Guardamos las IDs generadas (simulando para el seed de platos)
-- Ojo: Al ser UUID, en Supabase lo ideal es que al correr esto generemos relaciones
-- Como es un script de inicialización, lo hacemos con subqueries:

INSERT INTO platos (nombre, precio_venta) VALUES 
('Tartar de Salmón', 18.50),
('Solomillo con Patatas', 24.00);

-- Seed Escandallo Tartar de Salmón (Usamos subqueries para encontrar el UUID)
INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.200 -- 200 gramos de salmón
FROM platos p, ingredientes_base i WHERE p.nombre = 'Tartar de Salmón' AND i.nombre = 'Salmón';

INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.050 -- 50 gramos de aguacate
FROM platos p, ingredientes_base i WHERE p.nombre = 'Tartar de Salmón' AND i.nombre = 'Aguacate';

INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.020 -- 20 gramos de cebolla
FROM platos p, ingredientes_base i WHERE p.nombre = 'Tartar de Salmón' AND i.nombre = 'Cebolla';

-- Seed Escandallo Solomillo
INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.250 -- 250 gramos de solomillo
FROM platos p, ingredientes_base i WHERE p.nombre = 'Solomillo con Patatas' AND i.nombre = 'Solomillo Ternera';

INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.150 -- 150 gramos de patatas
FROM platos p, ingredientes_base i WHERE p.nombre = 'Solomillo con Patatas' AND i.nombre = 'Patata';
