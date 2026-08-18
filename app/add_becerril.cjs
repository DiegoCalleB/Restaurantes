const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sb = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_ANON_KEY.replace(/"/g, '')
);

async function add() {
  await sb.from('restaurantes').insert({ nombre: 'Becerril de la Sierra' });
  console.log('Restaurado Becerril de la Sierra');
}
add();
