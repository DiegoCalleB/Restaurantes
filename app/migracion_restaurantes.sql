-- 1. Crear tabla de restaurantes
CREATE TABLE restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificar la tabla de albaranes existente
ALTER TABLE albaranes
ADD COLUMN restaurante_id UUID REFERENCES restaurantes(id);

-- 3. Crear un restaurante por defecto para que puedas probar
INSERT INTO restaurantes (nombre) VALUES ('Mi Restaurante Principal');

-- 4. (Opcional) Asignar los albaranes que ya hayas subido a este restaurante
UPDATE albaranes 
SET restaurante_id = (SELECT id FROM restaurantes LIMIT 1)
WHERE restaurante_id IS NULL;

-- 5. RLS para la nueva tabla
ALTER TABLE restaurantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a anonimos en restaurantes" ON restaurantes FOR ALL USING (true);
