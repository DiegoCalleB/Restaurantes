import { createClient } from '@supabase/supabase-js'
import { findBestMatch } from './matchingService'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Inicializamos el cliente solo si las credenciales están configuradas
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para subir archivo al bucket
export async function subirArchivoBucket(file, bucketName = 'albaranes') {
  if (!supabase) throw new Error("Supabase no está configurado");
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// Helper para guardar el albarán y sus líneas
export async function guardarAlbaranExtraido(extractedData, imageUrl = null) {
  if (!supabase) throw new Error("Supabase no está configurado");
  
  // 1. Buscar o crear proveedor
  let proveedorId = null;
  if (extractedData.proveedor) {
    let { data: provs } = await supabase.from('proveedores')
      .select('id')
      .ilike('nombre', extractedData.proveedor)
      .limit(1);
      
    if (provs && provs.length > 0) {
      proveedorId = provs[0].id;
    } else {
      const { data: newProv, error: provErr } = await supabase.from('proveedores')
        .insert({ nombre: extractedData.proveedor })
        .select('id')
        .single();
      if (!provErr && newProv) proveedorId = newProv.id;
    }
  }

  // 2. Insertar Albarán
  // Format DD/MM/YYYY to YYYY-MM-DD for SQL if possible
  let formattedDate = null;
  if (extractedData.fecha) {
    const parts = extractedData.fecha.split('/');
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  let importeLimpio = null;
  if (extractedData.importeTotal) {
    const str = extractedData.importeTotal.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    importeLimpio = isNaN(num) ? null : num;
  }

  let baseImponibleLimpia = null;
  if (extractedData.baseImponible) {
    const str = extractedData.baseImponible.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    baseImponibleLimpia = isNaN(num) ? null : num;
  }

  // Limpiar el array de desglose_iva para asegurar números válidos
  const desgloseLimpio = (extractedData.desgloseIva || []).map(iva => {
    const p = parseFloat(iva.porcentaje?.toString().replace(/[^\d.,-]/g, '').replace(',', '.') || '0');
    const b = parseFloat(iva.base?.toString().replace(/[^\d.,-]/g, '').replace(',', '.') || '0');
    const c = parseFloat(iva.cuota?.toString().replace(/[^\d.,-]/g, '').replace(',', '.') || '0');
    return {
      porcentaje: isNaN(p) ? 0 : p,
      base: isNaN(b) ? 0 : b,
      cuota: isNaN(c) ? 0 : c
    };
  });

  const numeroLimpio = extractedData.numero || 'S/N';

  // 1.5 Check Duplicados
  if (proveedorId) {
    let query = supabase.from('albaranes').select('id, numero').eq('proveedor_id', proveedorId);
    
    if (numeroLimpio !== 'S/N') {
       query = query.eq('numero', numeroLimpio);
    } else {
       // Si no tiene número, usamos fecha e importe como huella dactilar
       if (formattedDate) query = query.eq('fecha', formattedDate);
       if (importeLimpio !== null) query = query.eq('importe_total', importeLimpio);
    }
    
    const { data: duplicados } = await query.limit(1);
    if (duplicados && duplicados.length > 0) {
       throw new Error(`Albarán duplicado. Ya existe uno con este proveedor y número/fecha (${numeroLimpio}).`);
    }
  }

  // 1.6 Buscar el restaurante por defecto
  let restauranteId = null;
  const { data: rests } = await supabase.from('restaurantes').select('id').limit(1);
  if (rests && rests.length > 0) {
    restauranteId = rests[0].id;
  }

  const { data: albaran, error: albErr } = await supabase.from('albaranes').insert({
    numero: numeroLimpio,
    fecha: formattedDate,
    proveedor_id: proveedorId,
    restaurante_id: restauranteId,
    importe_total: isNaN(importeLimpio) ? null : importeLimpio,
    base_imponible: isNaN(baseImponibleLimpia) ? null : baseImponibleLimpia,
    desglose_iva: desgloseLimpio,
    estado: 'pendiente',
    imagen_url: imageUrl,
    datos_raw: extractedData,
    tipo_albaran: extractedData.tipo || 'Otros'
  }).select().single();

  if (albErr) throw albErr;

  let tieneIncidenciaGlobal = false;

  // 3. Insertar Líneas con validación de histórico de precios y matching de ingredientes
  if (extractedData.lineas && extractedData.lineas.length > 0) {
    const lineasToInsert = [];
    
    // Traer todos los ingredientes base para hacer matching
    const { data: catalogoIngredientes } = await supabase.from('ingredientes_base').select('id, nombre');
    
    const cleanNumber = (val) => {
      if (!val) return null;
      // Eliminar todo lo que no sea número, punto o coma
      const str = val.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    };

    for (const l of extractedData.lineas) {
      const pUnit = cleanNumber(l.precioUnitario);
      const iLin = cleanNumber(l.importeLinea);
      
      let flag_incidencia = false;
      let motivo_incidencia = null;
      let ingredienteBaseId = null;
      
      // Matching inteligente
      if (catalogoIngredientes) {
         const bestMatch = findBestMatch(l.producto, catalogoIngredientes);
         if (bestMatch) {
            ingredienteBaseId = bestMatch.id;
         }
      }

      if (pUnit !== null && proveedorId) {
        // Calcular histórico de precio de este producto para este proveedor
        const { data: hist } = await supabase.from('lineas_albaran')
          .select('precio_unitario, albaranes!inner(proveedor_id)')
          .eq('albaranes.proveedor_id', proveedorId)
          .ilike('producto', l.producto); // ilike para ser un poco permisivo
          
        if (hist && hist.length > 0) {
          const precios = hist.map(h => h.precio_unitario).filter(p => p !== null && p > 0);
          if (precios.length > 0) {
            const avgPrice = precios.reduce((a, b) => a + b, 0) / precios.length;
            
            // Si el precio actual es un 10% mayor que la media histórica, marcamos incidencia
            if (pUnit > avgPrice * 1.10) {
              flag_incidencia = true;
              motivo_incidencia = `Sobreprecio detectado: €${pUnit.toFixed(2)} (Media: €${avgPrice.toFixed(2)})`;
              tieneIncidenciaGlobal = true;
            }
          }
        }
      }

      lineasToInsert.push({
        albaran_id: albaran.id,
        producto: l.producto,
        ingrediente_base_id: ingredienteBaseId,
        cantidad: typeof l.cantidad === 'number' ? l.cantidad : 1,
        precio_unitario: isNaN(pUnit) ? null : pUnit,
        importe_linea: isNaN(iLin) ? null : iLin,
        flag_incidencia,
        motivo_incidencia
      });
    }

    const { error: linErr } = await supabase.from('lineas_albaran').insert(lineasToInsert);
    if (linErr) console.error("Error guardando líneas:", linErr);
    
    // Si hubo alguna incidencia, actualizamos el estado del albarán
    if (tieneIncidenciaGlobal) {
      await supabase.from('albaranes').update({ estado: 'incidencia' }).eq('id', albaran.id);
      albaran.estado = 'incidencia';
    }
  }

  return albaran;
}

// Guarda los datos de una carta extraída (platos e ingredientes)
export async function guardarCartaExtraida(datosCarta, restauranteId) {
  if (!supabase) throw new Error("Supabase no está configurado");
  if (!datosCarta || !datosCarta.platos) return { success: false, platosNuevos: 0 };
  
  // 1. Obtener catálogo actual de platos del restaurante para no duplicar
  const { data: platosActuales } = await supabase.from('platos')
    .select('id, nombre')
    .eq('restaurante_id', restauranteId);
    
  const nombresPlatosActuales = new Set((platosActuales || []).map(p => p.nombre.toLowerCase()));

  // 2. Insertar ingredientes que no existan
  const { data: ingredientesBase } = await supabase.from('ingredientes_base').select('id, nombre, unidad_medida, precio_estimado');
  
  // Vamos a ir coleccionando los platos nuevos que se vayan a insertar
  let platosInsertados = 0;
  
  const platosNuevos = datosCarta.platos.filter(p => !nombresPlatosActuales.has(p.nombre.toLowerCase()));

  for (let index = 0; index < platosNuevos.length; index++) {
    const platoData = platosNuevos[index];
    
    // Parse precio
    let pvpLimpio = 0;
    if (platoData.precioVenta) {
      const strPvp = platoData.precioVenta.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
      const numPvp = parseFloat(strPvp);
      if (!isNaN(numPvp)) pvpLimpio = numPvp;
    }
    
    // Categoría genérica si no viene
    const categoriaLimpia = platoData.categoria ? platoData.categoria : 'Otros';

    // Insertamos plato
    const { data: platoNuevo, error: errPlato } = await supabase.from('platos')
      .insert({
        nombre: platoData.nombre,
        precio_venta: pvpLimpio,
        restaurante_id: restauranteId,
        categoria: categoriaLimpia,
        orden: index
      })
      .select('id').single();
      
    if (errPlato) {
      console.error("Error insertando plato:", errPlato);
      continue;
    }
    
    platosInsertados++;
    
    // Insertamos escandallos
    if (platoData.ingredientes && platoData.ingredientes.length > 0) {
      const lineasEscandallo = [];
      
      for (const ingData of platoData.ingredientes) {
        let ingId = null;
        
        // Comprobar si ya existe en la memoria cacheada (ingredientesBase)
        const existingIng = ingredientesBase?.find(i => i.nombre.toLowerCase() === ingData.nombre.toLowerCase());
        
        // Parse precio estimado (tanto si es nuevo como si actualizamos uno existente a 0)
        let precioEstLimpio = 0;
        if (ingData.precioEstimado) {
          const strPre = ingData.precioEstimado.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
          const numPre = parseFloat(strPre);
          if (!isNaN(numPre)) precioEstLimpio = numPre;
        }

        if (existingIng) {
          ingId = existingIng.id;
          
          // Si el ingrediente existe pero su precio estimado es 0, lo actualizamos con la predicción de la IA
          if ((!existingIng.precio_estimado || existingIng.precio_estimado === 0) && precioEstLimpio > 0) {
            await supabase.from('ingredientes_base')
              .update({ precio_estimado: precioEstLimpio })
              .eq('id', ingId);
            existingIng.precio_estimado = precioEstLimpio; // actualizamos caché local
          }
          
        } else {
          // Lo insertamos nuevo
          const { data: newIng, error: newIngErr } = await supabase.from('ingredientes_base')
            .insert({ 
              nombre: ingData.nombre, 
              unidad_medida: ingData.unidadMedida || 'kg',
              precio_estimado: precioEstLimpio
            })
            .select('id').single();
            
          if (newIng && !newIngErr) {
            ingId = newIng.id;
            // Lo añadimos a la caché local para siguientes iteraciones
            ingredientesBase?.push({ id: ingId, nombre: ingData.nombre, unidad_medida: ingData.unidadMedida || 'kg', precio_estimado: precioEstLimpio });
          } else {
            // Fallback por si falló el insert por concurrencia
            const { data: fallIng } = await supabase.from('ingredientes_base').select('id').eq('nombre', ingData.nombre).single();
            if (fallIng) ingId = fallIng.id;
          }
        }
        
        if (ingId) {
          // Parse cantidad
          let cantLimpia = 0.1;
          if (ingData.cantidad) {
            const strCant = ingData.cantidad.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
            const numCant = parseFloat(strCant);
            if (!isNaN(numCant)) cantLimpia = numCant;
          }

          lineasEscandallo.push({
            plato_id: platoNuevo.id,
            ingrediente_id: ingId,
            cantidad: cantLimpia
          });
        }
      }
      
      if (lineasEscandallo.length > 0) {
        await supabase.from('escandallos').insert(lineasEscandallo);
      }
    }
  }
  
  return { success: true, platosNuevos: platosInsertados };
}
