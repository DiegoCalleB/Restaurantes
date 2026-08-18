-- 1. Añadir la columna base_imponible
ALTER TABLE albaranes
ADD COLUMN base_imponible NUMERIC(10,2);

-- 2. Añadir la columna desglose_iva para soportar múltiples IVAs (JSONB)
ALTER TABLE albaranes
ADD COLUMN desglose_iva JSONB DEFAULT '[]'::jsonb;
