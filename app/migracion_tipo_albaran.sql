-- 1. Añadir la columna tipo_albaran
ALTER TABLE albaranes
ADD COLUMN tipo_albaran TEXT DEFAULT 'Otros';

-- Nota: Si hay albaranes antiguos, se quedarán con 'Otros' por defecto.
