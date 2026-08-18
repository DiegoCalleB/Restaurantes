import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parsear .env a mano
const env = fs.readFileSync('.env', 'utf-8');
const envLines = env.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
const envMap = {};
envLines.forEach(line => {
  const [key, ...vals] = line.split('=');
  envMap[key] = vals.join('=').replace(/^"|"$/g, '');
});

const supabaseUrl = envMap['VITE_SUPABASE_URL'];
const supabaseKey = envMap['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeDatabase() {
  console.log("Iniciando borrado de tablas...");

  // Borramos en orden para evitar problemas de foreign keys
  console.log("Borrando lineas_albaran...");
  const { error: err1 } = await supabase.from('lineas_albaran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err1) console.error("Error borrando líneas:", err1);

  console.log("Borrando albaranes...");
  const { error: err2 } = await supabase.from('albaranes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err2) console.error("Error borrando albaranes:", err2);

  console.log("Borrando proveedores...");
  const { error: err3 } = await supabase.from('proveedores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err3) console.error("Error borrando proveedores:", err3);

  console.log("¡Limpieza completada!");
}

wipeDatabase();
