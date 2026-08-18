const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Seeding restaurantes...');
  
  // 1. Delete all existing restaurants to start fresh, or just create if not exists
  let { data: rests, error: errRests } = await supabase.from('restaurantes').select('*');
  if (errRests) console.error(errRests);
  rests = rests || [];
  
  const targetNames = ['Restaurante Madrid', 'Restaurante Sierra'];
  for (const name of targetNames) {
    if (!rests.find(r => r.nombre === name)) {
      await supabase.from('restaurantes').insert({ nombre: name });
    }
  }
  
  // Fetch again to get IDs
  let { data: newRests } = await supabase.from('restaurantes').select('*');
  const madrid = newRests.find(r => r.nombre === 'Restaurante Madrid');
  const sierra = newRests.find(r => r.nombre === 'Restaurante Sierra');
  
  if (!madrid || !sierra) {
    console.error('Failed to create restaurants');
    return;
  }
  
  console.log('Restaurants ready. Updating albaranes...');
  
  // Assign all existing albaranes randomly to one of the two
  let { data: albs } = await supabase.from('albaranes').select('id');
  
  for (let i = 0; i < albs.length; i++) {
    const alb = albs[i];
    const targetRest = (i % 2 === 0) ? madrid.id : sierra.id;
    await supabase.from('albaranes').update({ restaurante_id: targetRest }).eq('id', alb.id);
  }
  
  console.log('Done assigning albaranes.');
}

main().catch(console.error);
