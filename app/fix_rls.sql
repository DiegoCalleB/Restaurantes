-- Asegurarnos de que las tablas de base de datos permiten INSERT sin estar logueado (anon)
DROP POLICY IF EXISTS "Permitir todo a anonimos en proveedores" ON proveedores;
CREATE POLICY "Permitir todo a anonimos en proveedores" ON proveedores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anonimos en albaranes" ON albaranes;
CREATE POLICY "Permitir todo a anonimos en albaranes" ON albaranes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anonimos en lineas" ON lineas_albaran;
CREATE POLICY "Permitir todo a anonimos en lineas" ON lineas_albaran FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a anonimos en restaurantes" ON restaurantes;
CREATE POLICY "Permitir todo a anonimos en restaurantes" ON restaurantes FOR ALL USING (true) WITH CHECK (true);

-- EL CULPABLE PROBABLE: Políticas de seguridad para el Storage (archivos físicos)
-- Supabase bloquea por defecto que usuarios anónimos (sin hacer login) suban archivos.
CREATE POLICY "Permitir SELECT a anonimos en Storage" ON storage.objects FOR SELECT USING (bucket_id = 'albaranes');
CREATE POLICY "Permitir INSERT a anonimos en Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'albaranes');
CREATE POLICY "Permitir UPDATE a anonimos en Storage" ON storage.objects FOR UPDATE USING (bucket_id = 'albaranes');
CREATE POLICY "Permitir DELETE a anonimos en Storage" ON storage.objects FOR DELETE USING (bucket_id = 'albaranes');
