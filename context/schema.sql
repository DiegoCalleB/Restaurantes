-- ====================================================================
-- ESQUEMA COMPLETO Y CORREGIDO DE BASE DE DATOS SUPABASE - RESTAURANTES
-- PROYECTO: Restaurantes (AIron Labs)
-- ====================================================================

-- Habilitar extensión UUID si no estuviera habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. Tabla Restaurantes (Multi-tenant)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 2. Tabla Proveedores
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cif TEXT,
  telefono TEXT,
  email TEXT,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 3. Tabla Ingredientes Base (Catálogo Maestro para Escandallos)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingredientes_base (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  unidad_medida TEXT NOT NULL DEFAULT 'kg' CHECK (unidad_medida IN ('kg', 'g', 'l', 'ml', 'unidades')),
  precio_estimado NUMERIC(10,4) DEFAULT 0.0000,
  stock_actual NUMERIC(10,4) DEFAULT 0.0000,
  stock_minimo NUMERIC(10,4) DEFAULT 0.0000,
  alergenos JSONB DEFAULT '[]'::jsonb,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 4. Tabla Platos (Menú del Restaurante)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'Principal',
  precio_venta NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  orden INT DEFAULT 999,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 5. Tabla Escandallos (Relación Plato <-> Ingrediente Base)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escandallos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plato_id UUID REFERENCES platos(id) ON DELETE CASCADE NOT NULL,
  ingrediente_id UUID REFERENCES ingredientes_base(id) ON DELETE CASCADE NOT NULL,
  cantidad NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 6. Tabla Albaranes
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albaranes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  fecha DATE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  importe_total NUMERIC(10,2) DEFAULT 0.00,
  base_imponible NUMERIC(10,2) DEFAULT 0.00,
  desglose_iva JSONB DEFAULT '[]'::jsonb,
  tipo_albaran TEXT DEFAULT 'Comida' CHECK (tipo_albaran IN ('Comida', 'Bebida', 'Limpieza', 'Servicios', 'Otros')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'incidencia')),
  imagen_url TEXT,
  datos_raw JSONB,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 7. Tabla Líneas de Albarán
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lineas_albaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  albaran_id UUID REFERENCES albaranes(id) ON DELETE CASCADE NOT NULL,
  ingrediente_base_id UUID REFERENCES ingredientes_base(id) ON DELETE SET NULL,
  producto TEXT NOT NULL,
  cantidad NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
  precio_unitario NUMERIC(10,4) DEFAULT 0.0000,
  importe_linea NUMERIC(10,2) DEFAULT 0.00,
  flag_incidencia BOOLEAN DEFAULT false,
  motivo_incidencia TEXT
);

-- --------------------------------------------------------------------
-- 8. Tabla Pedidos a Proveedores
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  estado TEXT DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Enviado', 'Recibido', 'Conciliado', 'Cancelado'))
);

-- --------------------------------------------------------------------
-- 8b. Tabla Facturas de Proveedor (Conciliación Mensual)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas_proveedor (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  numero_factura TEXT NOT NULL,
  fecha_emision DATE,
  periodo_mes TEXT,
  importe_factura NUMERIC(10,2) DEFAULT 0.00,
  suma_albaranes NUMERIC(10,2) DEFAULT 0.00,
  diferencia NUMERIC(10,2) DEFAULT 0.00,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'conciliada', 'incidencia')),
  desglose_discrepancias JSONB DEFAULT '[]'::jsonb,
  imagen_url TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 9. Tabla Líneas de Pedido
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lineas_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  ingrediente_base_id UUID REFERENCES ingredientes_base(id) ON DELETE SET NULL,
  producto TEXT NOT NULL,
  cantidad NUMERIC(10,4) NOT NULL DEFAULT 0.0000,
  precio_unitario NUMERIC(10,4) DEFAULT 0.0000
);

-- --------------------------------------------------------------------
-- 10. Tabla Medios RRPP (Contactos de Prensa y Marketing)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rrpp_medios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Prensa', 'Radio', 'TV', 'Podcast', 'Redes')),
  contacto TEXT,
  alcance TEXT,
  estado TEXT DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'Pendiente_Aprobacion', 'Aprobado', 'Enviado', 'Esperando_Respuesta', 'Interesado', 'Aceptado', 'Rechazado')),
  enfoque_editorial TEXT,
  pitch_generado TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 11. Tabla Memoria RRPP (Reglas de Redacción por Categoría)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rrpp_memoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT UNIQUE NOT NULL,
  reglas TEXT,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------------------
-- 12. Tabla Ordenes de Búsqueda RRPP (Cola para Agente Scout)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rrpp_ordenes_busqueda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
  termino_busqueda TEXT NOT NULL,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Procesando', 'Completado', 'Error')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- Nota: En desarrollo se habilitan accesos anónimos. Para producción
-- se restringirán por usuario auth.uid() en Supabase.
-- ====================================================================
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredientes_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE platos ENABLE ROW LEVEL SECURITY;
ALTER TABLE escandallos ENABLE ROW LEVEL SECURITY;
ALTER TABLE albaranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_albaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrpp_medios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrpp_memoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrpp_ordenes_busqueda ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a anonimos en restaurantes" ON restaurantes FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en proveedores" ON proveedores FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en ingredientes_base" ON ingredientes_base FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en platos" ON platos FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en escandallos" ON escandallos FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en albaranes" ON albaranes FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en lineas_albaran" ON lineas_albaran FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en pedidos" ON pedidos FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en lineas_pedido" ON lineas_pedido FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en facturas_proveedor" ON facturas_proveedor FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en rrpp_medios" ON rrpp_medios FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en rrpp_memoria" ON rrpp_memoria FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en rrpp_ordenes_busqueda" ON rrpp_ordenes_busqueda FOR ALL USING (true);
