-- Este bloque anónimo de PL/pgSQL genera datos de prueba (mocks)
-- Creará restaurantes nuevos y les asignará albaranes cruzando los proveedores existentes (o creándolos si no hay).

DO $$ 
DECLARE
    v_prov1 UUID;
    v_prov2 UUID;
    v_rest1 UUID;
    v_rest2 UUID;
    v_rest3 UUID;
    v_nuevo_albaran_id UUID;
BEGIN
    -- 1. Pillamos un par de proveedores existentes (o los creamos si la tabla está vacía)
    SELECT id INTO v_prov1 FROM proveedores LIMIT 1;
    IF v_prov1 IS NULL THEN
        INSERT INTO proveedores (nombre, cif) VALUES ('Distribuciones Paco', 'B12345678') RETURNING id INTO v_prov1;
    END IF;
    
    SELECT id INTO v_prov2 FROM proveedores OFFSET 1 LIMIT 1;
    IF v_prov2 IS NULL THEN
        INSERT INTO proveedores (nombre, cif) VALUES ('Bebidas del Sur', 'A98765432') RETURNING id INTO v_prov2;
    END IF;

    -- 2. Creamos 3 restaurantes nuevos para hacer la cruzada
    INSERT INTO restaurantes (nombre) VALUES ('El Asador de Diego') RETURNING id INTO v_rest1;
    INSERT INTO restaurantes (nombre) VALUES ('Pizzería Napoli') RETURNING id INTO v_rest2;
    INSERT INTO restaurantes (nombre) VALUES ('Bar La Esquina') RETURNING id INTO v_rest3;

    -- ==========================================
    -- 3. ALBARANES PARA "El Asador de Diego"
    -- ==========================================
    
    -- Albarán del Proveedor 1
    INSERT INTO albaranes (numero, fecha, proveedor_id, restaurante_id, importe_total, estado)
    VALUES ('ALB-2026-001', CURRENT_DATE - INTERVAL '2 days', v_prov1, v_rest1, 250.50, 'validado')
    RETURNING id INTO v_nuevo_albaran_id;
    
    INSERT INTO lineas_albaran (albaran_id, producto, cantidad, precio_unitario, importe_linea)
    VALUES 
    (v_nuevo_albaran_id, 'Caja Tomates 5kg', 2, 15.00, 30.00),
    (v_nuevo_albaran_id, 'Saco Patatas 20kg', 1, 20.50, 20.50);

    -- Albarán del Proveedor 2
    INSERT INTO albaranes (numero, fecha, proveedor_id, restaurante_id, importe_total, estado)
    VALUES ('BEB-001-ASADOR', CURRENT_DATE - INTERVAL '1 days', v_prov2, v_rest1, 500.00, 'pendiente')
    RETURNING id INTO v_nuevo_albaran_id;

    INSERT INTO lineas_albaran (albaran_id, producto, cantidad, precio_unitario, importe_linea)
    VALUES 
    (v_nuevo_albaran_id, 'Barril Cerveza 50L', 4, 100.00, 400.00),
    (v_nuevo_albaran_id, 'Caja Coca-Cola', 5, 20.00, 100.00);


    -- ==========================================
    -- 4. ALBARANES PARA "Pizzería Napoli"
    -- ==========================================
    
    -- Albarán del Proveedor 1 (con incidencia de ejemplo)
    INSERT INTO albaranes (numero, fecha, proveedor_id, restaurante_id, importe_total, estado)
    VALUES ('ALB-2026-002', CURRENT_DATE, v_prov1, v_rest2, 120.00, 'incidencia')
    RETURNING id INTO v_nuevo_albaran_id;

    INSERT INTO lineas_albaran (albaran_id, producto, cantidad, precio_unitario, importe_linea, flag_incidencia, motivo_incidencia)
    VALUES 
    (v_nuevo_albaran_id, 'Harina 00 25kg', 2, 40.00, 80.00, false, null),
    (v_nuevo_albaran_id, 'Queso Mozzarella', 1, 40.00, 40.00, true, 'Llegó en mal estado');

    -- Albarán del Proveedor 2
    INSERT INTO albaranes (numero, fecha, proveedor_id, restaurante_id, importe_total, estado)
    VALUES ('BEB-002-NAPOLI', CURRENT_DATE, v_prov2, v_rest2, 150.00, 'validado')
    RETURNING id INTO v_nuevo_albaran_id;

    INSERT INTO lineas_albaran (albaran_id, producto, cantidad, precio_unitario, importe_linea)
    VALUES 
    (v_nuevo_albaran_id, 'Agua con gas 1.5L', 10, 5.00, 50.00),
    (v_nuevo_albaran_id, 'Caja Vino Tinto', 2, 50.00, 100.00);

    -- ==========================================
    -- 5. ALBARANES PARA "Bar La Esquina"
    -- ==========================================
    
    -- Albarán del Proveedor 1
    INSERT INTO albaranes (numero, fecha, proveedor_id, restaurante_id, importe_total, estado)
    VALUES ('ALB-2026-003', CURRENT_DATE - INTERVAL '5 days', v_prov1, v_rest3, 75.00, 'validado')
    RETURNING id INTO v_nuevo_albaran_id;

    INSERT INTO lineas_albaran (albaran_id, producto, cantidad, precio_unitario, importe_linea)
    VALUES 
    (v_nuevo_albaran_id, 'Servilletas papel', 5, 10.00, 50.00),
    (v_nuevo_albaran_id, 'Palillos', 10, 2.50, 25.00);

END $$;
