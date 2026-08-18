-- 1. Tabla Proveedores
CREATE TABLE proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  cif TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla Albaranes
CREATE TABLE albaranes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  fecha DATE,
  proveedor_id UUID REFERENCES proveedores(id),
  importe_total NUMERIC(10,2),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'validado', 'incidencia')),
  imagen_url TEXT, -- URL o path del documento en el bucket "albaranes"
  datos_raw JSONB, -- Guardamos el JSON de Gemini crudo por si acaso
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla Líneas de Albarán
CREATE TABLE lineas_albaran (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  albaran_id UUID REFERENCES albaranes(id) ON DELETE CASCADE,
  producto TEXT NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL,
  precio_unitario NUMERIC(10,2),
  importe_linea NUMERIC(10,2),
  flag_incidencia BOOLEAN DEFAULT false,
  motivo_incidencia TEXT
);

-- Políticas RLS rápidas para pruebas (Permiten leer y escribir todo)
-- OJO: En producción B2C, esto hay que protegerlo con roles, pero para empezar nos vale
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE albaranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineas_albaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a anonimos en proveedores" ON proveedores FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en albaranes" ON albaranes FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en lineas" ON lineas_albaran FOR ALL USING (true);

-- 4. Tabla Medios RRPP (Contactos)
CREATE TABLE rrpp_medios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id),
  nombre TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('Prensa', 'Radio', 'TV', 'Podcast', 'Redes')),
  contacto TEXT,
  alcance TEXT,
  estado TEXT DEFAULT 'Nuevo' CHECK (estado IN ('Nuevo', 'Pendiente_Aprobacion', 'Aprobado', 'Enviado', 'Esperando_Respuesta', 'Interesado', 'Aceptado', 'Rechazado')),
  enfoque_editorial TEXT,
  pitch_generado TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla Memoria RRPP (Directrices y reglas)
CREATE TABLE rrpp_memoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT UNIQUE NOT NULL, -- ej: 'Radio', 'Prensa', 'General'
  reglas TEXT,
  ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE rrpp_medios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrpp_memoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a anonimos en medios" ON rrpp_medios FOR ALL USING (true);
CREATE POLICY "Permitir todo a anonimos en memoria" ON rrpp_memoria FOR ALL USING (true);

-- 6. Tabla Ordenes de Búsqueda (Cola para Scout)
CREATE TABLE rrpp_ordenes_busqueda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES restaurantes(id),
  termino_busqueda TEXT NOT NULL,
  estado TEXT DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Procesando', 'Completado', 'Error')),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE rrpp_ordenes_busqueda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a anonimos en ordenes" ON rrpp_ordenes_busqueda FOR ALL USING (true);
