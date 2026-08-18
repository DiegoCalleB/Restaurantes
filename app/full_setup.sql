-- ==========================================
-- SUPER SETUP SQL: Crea la base de datos entera
-- Ejecuta este script para tener todo perfecto
-- ==========================================

-- 1. Tablas Base (Catálogos)
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cif TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredientes_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  unidad_medida TEXT DEFAULT 'kg',
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS platos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  precio_venta NUMERIC(10,2) NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla Albaranes (Con todas las columnas nuevas)
CREATE TABLE IF NOT EXISTS albaranes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha DATE,
  proveedor_id UUID REFERENCES proveedores(id),
  restaurante_id UUID REFERENCES restaurantes(id),
  importe_total NUMERIC(10,2),
  base_imponible NUMERIC(10,2),
  desglose_iva JSONB DEFAULT '[]'::jsonb,
  tipo_albaran TEXT DEFAULT 'Otros',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'incidencia')),
  imagen_url TEXT,
  datos_raw JSONB,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla Líneas y Escandallos (Relaciones)
CREATE TABLE IF NOT EXISTS lineas_albaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  albaran_id UUID REFERENCES albaranes(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL,
  precio_unitario NUMERIC(10,2),
  importe_linea NUMERIC(10,2),
  flag_incidencia BOOLEAN DEFAULT false,
  motivo_incidencia TEXT,
  ingrediente_base_id UUID REFERENCES ingredientes_base(id)
);

CREATE TABLE IF NOT EXISTS escandallos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plato_id UUID REFERENCES platos(id) ON DELETE CASCADE,
  ingrediente_id UUID REFERENCES ingredientes_base(id),
  cantidad NUMERIC(10,3) NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Permisos RLS (Permitimos todo para pruebas)
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE albaranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_albaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escandallos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_provs" ON proveedores;
DROP POLICY IF EXISTS "anon_all_rests" ON restaurantes;
DROP POLICY IF EXISTS "anon_all_albs" ON albaranes;
DROP POLICY IF EXISTS "anon_all_lines" ON lineas_albaran;
DROP POLICY IF EXISTS "anon_all_ings" ON ingredientes_base;
DROP POLICY IF EXISTS "anon_all_platos" ON platos;
DROP POLICY IF EXISTS "anon_all_escs" ON escandallos;

CREATE POLICY "anon_all_provs" ON proveedores FOR ALL USING (true);
CREATE POLICY "anon_all_rests" ON restaurantes FOR ALL USING (true);
CREATE POLICY "anon_all_albs" ON albaranes FOR ALL USING (true);
CREATE POLICY "anon_all_lines" ON lineas_albaran FOR ALL USING (true);
CREATE POLICY "anon_all_ings" ON ingredientes_base FOR ALL USING (true);
CREATE POLICY "anon_all_platos" ON platos FOR ALL USING (true);
CREATE POLICY "anon_all_escs" ON escandallos FOR ALL USING (true);

-- 5. Datos Semilla Básicos
INSERT INTO restaurantes (nombre) 
SELECT 'Mi Restaurante Principal' WHERE NOT EXISTS (SELECT 1 FROM restaurantes);

INSERT INTO ingredientes_base (nombre, unidad_medida) VALUES 
('Salmón', 'kg'), ('Aguacate', 'kg'), ('Cebolla', 'kg'), 
('Salsa Soja', 'litro'), ('Solomillo Ternera', 'kg'), ('Patata', 'kg')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO platos (nombre, precio_venta) 
SELECT 'Tartar de Salmón', 18.50 WHERE NOT EXISTS (SELECT 1 FROM platos WHERE nombre = 'Tartar de Salmón');

INSERT INTO platos (nombre, precio_venta) 
SELECT 'Solomillo con Patatas', 24.00 WHERE NOT EXISTS (SELECT 1 FROM platos WHERE nombre = 'Solomillo con Patatas');

-- Escandallos semilla
INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.200 FROM platos p, ingredientes_base i 
WHERE p.nombre = 'Tartar de Salmón' AND i.nombre = 'Salmón' 
AND NOT EXISTS (SELECT 1 FROM escandallos WHERE plato_id = p.id AND ingrediente_id = i.id);

INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.050 FROM platos p, ingredientes_base i 
WHERE p.nombre = 'Tartar de Salmón' AND i.nombre = 'Aguacate'
AND NOT EXISTS (SELECT 1 FROM escandallos WHERE plato_id = p.id AND ingrediente_id = i.id);

INSERT INTO escandallos (plato_id, ingrediente_id, cantidad)
SELECT p.id, i.id, 0.250 FROM platos p, ingredientes_base i 
WHERE p.nombre = 'Solomillo con Patatas' AND i.nombre = 'Solomillo Ternera'
AND NOT EXISTS (SELECT 1 FROM escandallos WHERE plato_id = p.id AND ingrediente_id = i.id);

ALTER TABLE ingredientes_base ADD COLUMN IF NOT EXISTS precio_estimado NUMERIC(10,2) DEFAULT 0;

ALTER TABLE platos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE platos ADD COLUMN IF NOT EXISTS orden INTEGER;
