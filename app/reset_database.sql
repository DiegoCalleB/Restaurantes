-- Este script vacía todas las tablas principales de la base de datos de una vez
-- El CASCADE se encarga de saltarse las restricciones de Foreign Keys para borrar
-- en cadena de forma segura y dejarlo todo a cero.

TRUNCATE TABLE lineas_albaran, albaranes, proveedores, restaurantes CASCADE;
