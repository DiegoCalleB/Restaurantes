import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useAppData() {
  const [albaranes, setAlbaranes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [ingredientesBase, setIngredientesBase] = useState([]);
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);

  const crearEscandallo = async (platoData, ingredientesData) => {
    if (!supabase) return false;
    try {
      // 1. Crear el plato
      const { data: nuevoPlato, error: errPlato } = await supabase
        .from('platos')
        .insert([{ nombre: platoData.nombre, precio_venta: platoData.precio_venta }])
        .select()
        .single();
        
      if (errPlato || !nuevoPlato) throw errPlato;

      // 2. Crear las líneas de escandallo
      const lineas = ingredientesData.map(ing => ({
        plato_id: nuevoPlato.id,
        ingrediente_id: ing.ingrediente_id,
        cantidad: ing.cantidad
      }));

      if (lineas.length > 0) {
        const { error: errEscandallo } = await supabase
          .from('escandallos')
          .insert(lineas);
        
        if (errEscandallo) throw errEscandallo;
      }
      
      await fetchData(); // Refrescar los datos
      return true;
    } catch (e) {
      console.error("Error creando escandallo:", e);
      return false;
    }
  };

  const eliminarPlato = async (platoId) => {
    if (!supabase) return false;
    try {
      // Borramos primero los escandallos explícitamente para asegurar que no hay problemas de FK
      await supabase.from('escandallos').delete().eq('plato_id', platoId);
      
      const { error } = await supabase.from('platos').delete().eq('id', platoId);
      if (error) throw error;
      
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error eliminando plato:", e);
      return false;
    }
  };

  const eliminarAlbaran = async (albaranId) => {
    if (!supabase) return false;
    try {
      // Borramos primero las líneas del albarán explícitamente
      await supabase.from('lineas_albaran').delete().eq('albaran_id', albaranId);
      
      const { error } = await supabase.from('albaranes').delete().eq('id', albaranId);
      if (error) throw error;
      
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error eliminando albarán:", e);
      return false;
    }
  };

  const fetchData = async () => {
    if (!supabase) {
      console.warn("Supabase client is null. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Fetch restaurantes
      const { data: rests } = await supabase.from('restaurantes').select('*');
      if (rests) setRestaurantes(rests);

      // Fetch catalog data
      const { data: ingrData } = await supabase.from('ingredientes_base').select('id, nombre, unidad_medida, precio_estimado').order('nombre');
      if (ingrData) setIngredientesBase(ingrData);
      const { data: platosData } = await supabase.from('platos').select('*');
      const { data: escandallosData } = await supabase.from('escandallos').select('*, ingredientes_base(nombre, unidad_medida, precio_estimado)');

      // Fetch proveedores
      const { data: provs } = await supabase.from('proveedores').select('*');

      // Fetch albaranes con sus líneas y el nombre del proveedor
      const { data: albs } = await supabase
        .from('albaranes')
        .select(`
          *,
          proveedores ( nombre ),
          lineas_albaran ( * )
        `)
        .order('creado_en', { ascending: false });
        
      if (albs) {
        if (provs) {
          const provsConMetricas = provs.map(p => {
            const albsDelProv = albs.filter(a => a.proveedor_id === p.id);
            const totalGastado = albsDelProv.reduce((sum, a) => sum + (parseFloat(a.importe_total) || 0), 0);
            const countIncidencias = albsDelProv.filter(a => a.estado === 'incidencia').length;
            return {
              id: p.id,
              nombre: p.nombre,
              numAlbaranes: albsDelProv.length,
              importeTotal: totalGastado.toFixed(2),
              incidenciasPct: albsDelProv.length ? Math.round((countIncidencias / albsDelProv.length) * 100) : 0,
              variacionPrecio: '0', // Placeholder
              puntualidad: '100'    // Placeholder
            };
          });
          setProveedores(provsConMetricas);
        }
        // Formatear albaranes para que encajen con lo que esperan las vistas
        const formattedAlbaranes = albs.map(a => ({
          id: a.id,
          restaurante_id: a.restaurante_id,
          numero: a.numero,
          proveedor: a.proveedores?.nombre || 'Desconocido',
          tipo: a.tipo_albaran || 'Otros',
          fecha: a.fecha ? new Date(a.fecha).toLocaleDateString('es-ES') : 'Sin fecha',
          importe: a.importe_total || 0,
          baseImponible: a.base_imponible || 0,
          desgloseIva: a.desglose_iva || [],
          estado: a.estado,
          imagenUrl: a.imagen_url,
          items: (a.lineas_albaran || []).map(l => ({
            id: l.id,
            producto: l.producto,
            cantidad: l.cantidad,
            precioUnit: l.precio_unitario,
            total: l.importe_linea,
            flag: l.flag_incidencia,
            motivo: l.motivo_incidencia
          }))
        }));
        setAlbaranes(formattedAlbaranes);
      }

      // 3. Procesar Platos y Escandallos (Rentabilidad Viva)
      if (platosData && escandallosData && ingrData) {
        const preciosIngredientes = {};
        
        (albs || []).forEach(a => {
          (a.lineas_albaran || []).forEach(l => {
            if (l.ingrediente_base_id && l.precio_unitario) {
              if (!preciosIngredientes[l.ingrediente_base_id]) {
                preciosIngredientes[l.ingrediente_base_id] = [];
              }
              preciosIngredientes[l.ingrediente_base_id].push({
                precio: l.precio_unitario,
                albaranId: a.id
              });
            }
          });
        });

        const priceStats = {};
        for (const [id, prices] of Object.entries(preciosIngredientes)) {
          const currentEntry = prices[0];
          const previousEntry = prices.length > 1 ? prices[1] : currentEntry;
          
          const current = currentEntry.precio;
          const previous = previousEntry.precio;
          const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;
          const isAlert = percentChange > 5.0;

          priceStats[id] = {
            current,
            previous,
            percentChange,
            isAlert,
            albaranId: currentEntry.albaranId
          };
        }

        const platosCompletos = platosData.map(plato => {
          const receta = escandallosData.filter(e => e.plato_id === plato.id);
          
          let costeTotal = 0;
          let hasAlert = false;
          
          const ingredientesDetalle = receta.map(e => {
            const stats = priceStats[e.ingrediente_id] || { current: e.ingredientes_base?.precio_estimado || 0, isAlert: false, percentChange: 0 };
            const precioKg = stats.current; 
            const costeLinea = precioKg * e.cantidad;
            costeTotal += costeLinea;
            
            if (stats.isAlert) hasAlert = true;

            return {
              nombre: e.ingredientes_base?.nombre || 'Desconocido',
              cantidad: e.cantidad,
              unidad: e.ingredientes_base?.unidad_medida || 'u',
              precioReferencia: precioKg,
              coste: costeLinea,
              isAlert: stats.isAlert,
              percentChange: stats.percentChange,
              albaranId: stats.albaranId
            };
          });

          const precioVenta = parseFloat(plato.precio_venta) || 0;
          const margenEuros = precioVenta - costeTotal;
          const margenPct = precioVenta > 0 ? (margenEuros / precioVenta) * 100 : 0;

          return {
            id: plato.id,
            nombre: plato.nombre,
            restaurante_id: plato.restaurante_id,
            categoria: plato.categoria || 'Otros',
            orden: plato.orden || 999,
            precioVenta: precioVenta,
            coste: costeTotal,
            margenEuros: margenEuros,
            margenPct: margenPct,
            hasAlert: hasAlert,
            ingredientes: ingredientesDetalle
          };
        });

        setPlatos(platosCompletos);
      }
      
      // Fetch pedidos (si existe la tabla)
      try {
        const { data: resPed } = await supabase
          .from('pedidos')
          .select(`
            *,
            proveedores (nombre),
            lineas_pedido (id)
          `)
          .order('fecha_pedido', { ascending: false });

        if (resPed) {
          const formattedPedidos = resPed.map(p => ({
            id: p.id,
            restaurante_id: p.restaurante_id,
            proveedor: p.proveedores?.nombre || 'Desconocido',
            fecha: p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : '',
            estado: p.estado,
            lineas_count: p.lineas_pedido ? p.lineas_pedido.length : 0
          }));
          setPedidos(formattedPedidos);
        }
      } catch (errPed) {
        console.warn("Tabla de pedidos no disponible aún:", errPed);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMsg(error.message || "No se pudo conectar con Supabase");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Timeout de seguridad: Si tras 7 segundos sigue cargando, desbloqueamos la UI
    const timer = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          setErrorMsg("Tiempo de espera agotado (7s) al conectar con Supabase. Comprueba tu conexión a internet o los permisos de red/proxy.");
          return false;
        }
        return false;
      });
    }, 7000);

    fetchData();

    return () => clearTimeout(timer);
  }, []);

  return { albaranes, proveedores, restaurantes, platos, pedidos, ingredientesBase, loading, errorMsg, refreshData: fetchData, crearEscandallo, eliminarPlato, eliminarAlbaran };
}
