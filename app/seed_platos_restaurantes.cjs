process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Renombrando restaurantes y re-seeding platos...');
  
  // 1. Get restaurants
  let { data: rests } = await supabase.from('restaurantes').select('*');
  
  // Update the first two to the new names
  if (rests.length >= 1) {
    await supabase.from('restaurantes').update({ nombre: 'Mercado Tirso' }).eq('id', rests[0].id);
  } else {
    await supabase.from('restaurantes').insert({ nombre: 'Mercado Tirso' });
  }
  
  if (rests.length >= 2) {
    await supabase.from('restaurantes').update({ nombre: 'Becerril de la Sierra' }).eq('id', rests[1].id);
  } else {
    await supabase.from('restaurantes').insert({ nombre: 'Becerril de la Sierra' });
  }
  
  // Re-fetch to get IDs
  let { data: newRests } = await supabase.from('restaurantes').select('*');
  const tirso = newRests.find(r => r.nombre === 'Mercado Tirso');
  const becerril = newRests.find(r => r.nombre === 'Becerril de la Sierra');
  
  // 2. Add ingredients
  const ingredients = [
    { nombre: 'Carne Picada', unidad_medida: 'kg' },
    { nombre: 'Pan de Hamburguesa', unidad_medida: 'u' },
    { nombre: 'Patata Brava', unidad_medida: 'kg' },
    { nombre: 'Salsa Brava', unidad_medida: 'litro' },
    { nombre: 'Salmón Rojo', unidad_medida: 'kg' },
    { nombre: 'Trufa Negra', unidad_medida: 'kg' },
    { nombre: 'Solomillo Ternera', unidad_medida: 'kg' },
    { nombre: 'Arroz Arborio', unidad_medida: 'kg' },
    { nombre: 'Boletus', unidad_medida: 'kg' },
  ];
  
  for (const ing of ingredients) {
    await supabase.from('ingredientes_base').upsert(ing, { onConflict: 'nombre' });
  }
  
  let { data: dbIngredients } = await supabase.from('ingredientes_base').select('*');
  const getIng = (name) => dbIngredients.find(i => i.nombre === name)?.id;
  
  // 3. Clear old platos
  await supabase.from('platos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // 4. Create Platos
  const newPlatos = [
    // Mercado Tirso (Batallero)
    { nombre: 'Hamburguesa Clásica', precio_venta: 12.00, restaurante_id: tirso.id },
    { nombre: 'Bravas Caseras', precio_venta: 7.50, restaurante_id: tirso.id },
    
    // Becerril (Alta cocina)
    { nombre: 'Tartar de Salmón Rojo', precio_venta: 24.00, restaurante_id: becerril.id },
    { nombre: 'Solomillo con Trufa', precio_venta: 35.00, restaurante_id: becerril.id },
    { nombre: 'Risotto de Boletus', precio_venta: 22.00, restaurante_id: becerril.id }
  ];
  
  const { data: createdPlatos, error: platosErr } = await supabase.from('platos').insert(newPlatos).select();
  if (platosErr) console.error('Error platos:', platosErr);
  
  const pId = (name) => createdPlatos.find(p => p.nombre === name).id;
  
  // 5. Create Escandallos
  const escandallos = [
    // Hamburguesa
    { plato_id: pId('Hamburguesa Clásica'), ingrediente_id: getIng('Carne Picada'), cantidad: 0.200 },
    { plato_id: pId('Hamburguesa Clásica'), ingrediente_id: getIng('Pan de Hamburguesa'), cantidad: 1 },
    
    // Bravas
    { plato_id: pId('Bravas Caseras'), ingrediente_id: getIng('Patata Brava'), cantidad: 0.350 },
    { plato_id: pId('Bravas Caseras'), ingrediente_id: getIng('Salsa Brava'), cantidad: 0.050 },
    
    // Tartar
    { plato_id: pId('Tartar de Salmón Rojo'), ingrediente_id: getIng('Salmón Rojo'), cantidad: 0.180 },
    
    // Solomillo
    { plato_id: pId('Solomillo con Trufa'), ingrediente_id: getIng('Solomillo Ternera'), cantidad: 0.250 },
    { plato_id: pId('Solomillo con Trufa'), ingrediente_id: getIng('Trufa Negra'), cantidad: 0.010 },
    
    // Risotto
    { plato_id: pId('Risotto de Boletus'), ingrediente_id: getIng('Arroz Arborio'), cantidad: 0.100 },
    { plato_id: pId('Risotto de Boletus'), ingrediente_id: getIng('Boletus'), cantidad: 0.080 }
  ];
  
  const { error: escErr } = await supabase.from('escandallos').insert(escandallos);
  if (escErr) console.error('Error escandallos:', escErr);
  
  console.log('Done seeding platos and escandallos.');
}

main().catch(console.error);
