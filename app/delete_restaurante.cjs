const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Ignorar error de certificado TLS si estamos en desarrollo
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sb = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY.replace(/"/g, '')
);

async function borrarRestaurante(nombre) {
  console.log(`Buscando restaurante "${nombre}"...`);
  const { data: rests, error: errRests } = await sb.from('restaurantes').select('id, nombre').ilike('nombre', `%${nombre}%`);
  
  if (errRests) {
    console.error("Error buscando:", errRests);
    return;
  }
  
  if (!rests || rests.length === 0) {
    console.log(`No se encontró ningún restaurante que contenga "${nombre}".`);
    return;
  }

  for (const r of rests) {
    console.log(`Procediendo a borrar "${r.nombre}" (ID: ${r.id})...`);
    
    // 1. Buscar Platos
    const { data: platos } = await sb.from('platos').select('id').eq('restaurante_id', r.id);
    if (platos && platos.length > 0) {
      console.log(`Borrando escandallos de ${platos.length} platos...`);
      for (const p of platos) {
        await sb.from('escandallos').delete().eq('plato_id', p.id);
      }
      console.log(`Borrando los ${platos.length} platos...`);
      await sb.from('platos').delete().eq('restaurante_id', r.id);
    }

    // 2. Buscar Albaranes
    const { data: albaranes } = await sb.from('albaranes').select('id').eq('restaurante_id', r.id);
    if (albaranes && albaranes.length > 0) {
      console.log(`Borrando líneas de ${albaranes.length} albaranes...`);
      for (const a of albaranes) {
        await sb.from('lineas_albaran').delete().eq('albaran_id', a.id);
      }
      console.log(`Borrando los ${albaranes.length} albaranes...`);
      await sb.from('albaranes').delete().eq('restaurante_id', r.id);
    }
    
    // 3. Borrar Restaurante
    const { error: delErr } = await sb.from('restaurantes').delete().eq('id', r.id);
    if (delErr) {
      console.error(`Error borrando restaurante ${r.nombre}:`, delErr);
    } else {
      console.log(`Restaurante "${r.nombre}" borrado con éxito.`);
    }
  }
}

borrarRestaurante('Sierra').catch(console.error);
