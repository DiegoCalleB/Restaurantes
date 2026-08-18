-- Borramos todo el contenido de las tres tablas principales
-- Usamos CASCADE por si hay restricciones pendientes (las de lineas_albaran con albaranes ya lo tienen)

TRUNCATE TABLE lineas_albaran CASCADE;
TRUNCATE TABLE albaranes CASCADE;
TRUNCATE TABLE proveedores CASCADE;

-- (Opcional) Si también quieres borrar los restaurantes:
-- TRUNCATE TABLE restaurantes CASCADE;
