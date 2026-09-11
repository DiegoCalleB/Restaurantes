import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { deducirCategoriaPlato } from './utils/categoriaService';
import { obtenerImagenPlato, comprimirImagen } from './utils/imagenPlatoService';

const DEFAULT_RESTAURANTES = [
  { id: '68d0128c-d047-48d4-8cbe-08fe151aa632', nombre: 'Mercado Tirso' },
  { id: '9b5f1982-fb46-43cb-a393-387ec6f658ff', nombre: 'Becerril de la Sierra' }
];

function deducirAlergenosTexto(texto) {
  if (!texto) return [];
  const t = texto.toLowerCase();
  const res = new Set();
  
  if (/pan|harina|trigo|tosta|brioche|cerveza|croqueta|pasta|ramen|masa|galleta|hamburguesa|bravas/.test(t)) res.add('gluten');
  if (/queso|leche|nata|mantequilla|crema|bechamel|yogur|huancaína|trufa/.test(t)) res.add('lacteos');
  if (/huevo|mayonesa|alioli|tortilla|ensaladilla/.test(t)) res.add('huevos');
  if (/pescado|sardina|merluza|bacalao|atun|bonito|salmon|anchoa|lubina|dorada/.test(t)) res.add('pescado');
  if (/gamba|langostino|marisco|gambon|cangrejo|cigala/.test(t)) res.add('crustaceos');
  if (/mejillon|almeja|pulpo|calamar|chipiron|ostra/.test(t)) res.add('moluscos');
  if (/almendra|nuez|avellana|piñon|romesco|pistacho|anacardo/.test(t)) res.add('frutos_secos');
  if (/cacahuete/.test(t)) res.add('cacahuetes');
  if (/soja|hoisin|edamame|tofu|teriyaki/.test(t)) res.add('soja');
  if (/apio/.test(t)) res.add('apio');
  if (/mostaza/.test(t)) res.add('mostaza');
  if (/sesamo|ajonjoli/.test(t)) res.add('sesamo');
  if (/vino|cava|sidra|vinagre/.test(t)) res.add('sulfitos');
  if (/altramuz/.test(t)) res.add('altramuces');

  return Array.from(res);
}

export function useAppData() {
  const [albaranes, setAlbaranes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [restaurantes, setRestaurantes] = useState(DEFAULT_RESTAURANTES);
  const [platos, setPlatos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [ingredientesBase, setIngredientesBase] = useState([]);
  const [facturasProveedor, setFacturasProveedor] = useState([]);
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

  const actualizarStockIngrediente = async (ingredienteId, data) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('ingredientes_base')
        .update(data)
        .eq('id', ingredienteId);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error actualizando ingrediente:", e);
      return false;
    }
  };

  const guardarFacturaProveedor = async (facturaData) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('facturas_proveedor')
        .insert([facturaData]);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error guardando factura del proveedor:", e);
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
      const { data: ingrData } = await supabase.from('ingredientes_base').select('*').order('nombre');
      if (ingrData) {
        setIngredientesBase(ingrData);
      }
      const { data: platosData } = await supabase.from('platos').select('*');
      const { data: escandallosData } = await supabase.from('escandallos').select('*, ingredientes_base(*)');

      // Fetch proveedores
      const { data: provs } = await supabase.from('proveedores').select('*');

      // Fetch facturas_proveedor
      try {
        const { data: facts } = await supabase.from('facturas_proveedor').select('*, proveedores(nombre)').order('creado_en', { ascending: false });
        if (facts) {
          setFacturasProveedor(facts.map(f => ({
            id: f.id,
            proveedor: f.proveedores?.nombre || 'Proveedor',
            numeroFactura: f.numero_factura,
            fechaEmision: f.fecha_emision,
            periodoMes: f.periodo_mes || 'Agosto 2026',
            importeFactura: f.importe_factura,
            sumaAlbaranes: f.suma_albaranes,
            diferencia: f.diferencia,
            estado: f.estado,
            desgloseDiscrepancias: f.desglose_discrepancias || []
          })));
        }
      } catch (errFact) {
        console.warn("Tabla facturas_proveedor no disponible:", errFact);
      }

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

      // 3. Procesar Platos y Escandallos (Rentabilidad Viva y Alérgenos)
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
          const alergenosSet = new Set();

          const ingredientesDetalle = receta.map(e => {
            const ingBase = e.ingredientes_base || {};
            const stats = priceStats[e.ingrediente_id] || { current: ingBase.precio_estimado || 0, isAlert: false, percentChange: 0 };
            const precioKg = stats.current; 
            const costeLinea = precioKg * e.cantidad;
            costeTotal += costeLinea;
            
            if (stats.isAlert) hasAlert = true;

            // Colectar alérgenos (si están en BD o deducidos por nombre)
            let listAlerg = Array.isArray(ingBase.alergenos) ? ingBase.alergenos : (ingBase.alergenos ? JSON.parse(ingBase.alergenos) : []);
            if (listAlerg.length === 0) {
              listAlerg = deducirAlergenosTexto(ingBase.nombre);
            }
            listAlerg.forEach(a => alergenosSet.add(a));

            return {
              nombre: ingBase.nombre || 'Desconocido',
              cantidad: e.cantidad,
              unidad: ingBase.unidad_medida || 'u',
              precioReferencia: precioKg,
              coste: costeLinea,
              alergenos: listAlerg,
              isAlert: stats.isAlert,
              percentChange: stats.percentChange,
              albaranId: stats.albaranId
            };
          });

          // Deducir también alérgenos por el propio nombre del plato si no hay escandallo completo aún
          const alergenosPorNombre = deducirAlergenosTexto(plato.nombre);
          alergenosPorNombre.forEach(a => alergenosSet.add(a));

          const precioVenta = parseFloat(plato.precio_venta) || 0;
          const margenEuros = precioVenta - costeTotal;
          const margenPct = precioVenta > 0 ? (margenEuros / precioVenta) * 100 : 0;

          // PVP Recomendado para mantener un 70% de margen bruto (coste de materia prima = 30%)
          const pvpRecomendado = costeTotal > 0 ? Math.ceil((costeTotal / 0.30) * 2) / 2 : precioVenta; // Redondeado a los 50 céntimos más cercanos

          return {
            id: plato.id,
            nombre: plato.nombre,
            restaurante_id: plato.restaurante_id,
            categoria: (plato.categoria && plato.categoria !== 'Otros' && plato.categoria !== 'Principal')
              ? plato.categoria
              : deducirCategoriaPlato(plato.nombre, ingredientesDetalle),
            orden: plato.orden || 999,
            precioVenta: precioVenta,
            precio_venta: precioVenta,
            imagen_url: plato.imagen_url || obtenerImagenPlato(plato),
            imagenUrl: plato.imagen_url || obtenerImagenPlato(plato),
            descripcion: plato.descripcion || '',
            tiempo_preparacion: plato.tiempo_preparacion || plato.tiempoPreparacion || 15,
            tiempoPreparacion: plato.tiempo_preparacion || plato.tiempoPreparacion || 15,
            pvpRecomendado: pvpRecomendado,
            coste: costeTotal,
            margenEuros: margenEuros,
            margenPct: margenPct,
            hasAlert: hasAlert || margenPct < 65.0,
            alergenos: Array.from(alergenosSet),
            ingredientes: ingredientesDetalle
          };
        });

        setPlatos(platosCompletos);
      }
      
      // Fetch pedidos
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

  const actualizarPvpPlato = async (platoId, nuevoPvp) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('platos')
        .update({ precio_venta: nuevoPvp })
        .eq('id', platoId);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error actualizando PVP del plato:", e);
      return false;
    }
  };

  const actualizarImagenPlato = async (platoId, fileOrUrl) => {
    if (!supabase) return false;
    try {
      let finalUrl = fileOrUrl;

      // Si es un File del navegador, intentar subirlo a Supabase Storage Bucket 'platos'
      if (fileOrUrl instanceof File) {
        const { file, dataUrl } = await comprimirImagen(fileOrUrl);
        const fileName = `plato_${platoId}_${Date.now()}.jpg`;

        try {
          const { data: storageData, error: storageErr } = await supabase
            .storage
            .from('platos')
            .upload(fileName, file, { upsert: true, contentType: 'image/jpeg' });

          if (!storageErr && storageData) {
            const { data: publicUrlData } = supabase.storage.from('platos').getPublicUrl(fileName);
            if (publicUrlData && publicUrlData.publicUrl) {
              finalUrl = publicUrlData.publicUrl;
            } else {
              finalUrl = dataUrl;
            }
          } else {
            // Fallback a DataURL Base64 si el bucket de Supabase no está configurado o falla
            finalUrl = dataUrl;
          }
        } catch (errSt) {
          console.warn("Fallback a DataURL para almacenamiento de imagen:", errSt);
          finalUrl = dataUrl;
        }
      }

      const { error } = await supabase
        .from('platos')
        .update({ imagen_url: finalUrl })
        .eq('id', platoId);

      if (error) throw error;
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error actualizando imagen del plato:", e);
      return false;
    }
  };

  const actualizarCategoriaPlato = async (platoId, nuevaCategoria) => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('platos')
        .update({ categoria: nuevaCategoria })
        .eq('id', platoId);
      if (error) throw error;
      await fetchData();
      return true;
    } catch (e) {
      console.error("Error actualizando categoría del plato:", e);
      return false;
    }
  };

  const actualizarEscandalloCompleto = async (platoId, datosPlato, lineasIngredientes) => {
    if (!supabase) return false;
    try {
      // 1. Actualizar plato
      const { error: errPlato } = await supabase
        .from('platos')
        .update({
          nombre: datosPlato.nombre,
          precio_venta: datosPlato.precioVenta || datosPlato.precio_venta,
          categoria: datosPlato.categoria,
          tiempo_preparacion: datosPlato.tiempo_preparacion || datosPlato.tiempoPreparacion || 15
        })
        .eq('id', platoId);

      if (errPlato) throw errPlato;

      // 2. Reemplazar líneas de escandallo
      if (lineasIngredientes) {
        await supabase.from('escandallos').delete().eq('plato_id', platoId);

        const lineasInsert = lineasIngredientes.map(ing => ({
          plato_id: platoId,
          ingrediente_id: ing.ingrediente_id,
          cantidad: ing.cantidad
        }));

        if (lineasInsert.length > 0) {
          const { error: errEsc } = await supabase.from('escandallos').insert(lineasInsert);
          if (errEsc) throw errEsc;
        }
      }

      await fetchData();
      return true;
    } catch (e) {
      console.error("Error actualizando escandallo completo:", e);
      return false;
    }
  };

  useEffect(() => {
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

  return {
    albaranes, proveedores, restaurantes, platos, pedidos, ingredientesBase, facturasProveedor, loading, errorMsg,
    refreshData: fetchData, crearEscandallo, eliminarPlato, eliminarAlbaran, actualizarPvpPlato, actualizarStockIngrediente, guardarFacturaProveedor, actualizarImagenPlato, actualizarCategoriaPlato, actualizarEscandalloCompleto
  };
}
