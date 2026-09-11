/**
 * Servicio de clasificación gastronómica inteligente para platos de restaurantes.
 * Asigna categorías estándar según palabras clave en el nombre o ingredientes.
 */

export const CATEGORIAS_ESTANDAR = [
  { id: 'entrantes', nombre: 'Entrantes & Raciones', icono: '🧆' },
  { id: 'primeros', nombre: 'Primeros & Sopas', icono: '🥣' },
  { id: 'pastas_arroces', nombre: 'Pastas & Arroces', icono: '🥘' },
  { id: 'carnes', nombre: 'Carnes & Parrilla', icono: '🥩' },
  { id: 'pescados', nombre: 'Pescados & Mariscos', icono: '🐟' },
  { id: 'postres', nombre: 'Postres Caseros', icono: '🍰' },
  { id: 'bebidas', nombre: 'Bebidas & Bodega', icono: '🍷' }
];

export function deducirCategoriaPlato(nombre, ingredientes = []) {
  if (!nombre) return 'Entrantes & Raciones';
  
  // Normalizar texto
  const textoCombinado = [
    nombre,
    ...(Array.isArray(ingredientes) ? ingredientes.map(i => typeof i === 'string' ? i : (i.nombre || '')) : [])
  ].join(' ').toLowerCase();

  // 1. Postres
  if (/tarta|cheesecake|brownie|coulant|torrija|helado|flan|tiramisú|tiramisu|fruta|crema catalana|natilla|mousse|panacotta|postre/.test(textoCombinado)) {
    return 'Postres Caseros';
  }

  // 2. Bebidas
  if (/cerveza|vino|sangria|sangría|agua|refresco|café|cafe|cóctel|coctel|mojito|tinto de verano|vermut/.test(textoCombinado)) {
    return 'Bebidas & Bodega';
  }

  // 3. Pastas & Arroces
  if (/arroz|paella|risotto|fideuá|fideua|pasta|lasaña|lasaña|espagueti|spaghetti|tagliatelle|gnocchi|ravioli|macarrones|ramen/.test(textoCombinado)) {
    return 'Pastas & Arroces';
  }

  // 4. Pescados & Mariscos
  if (/merluza|bacalao|atun|atún|salmon|salmón|lubina|dorada|pulpo|calamar|chipiron|chipirones|gamba|gambas|langostino|marisco|ostra|almeja|mejillon|tataki de atun|sardina|anchoa/.test(textoCombinado)) {
    return 'Pescados & Mariscos';
  }

  // 5. Carnes & Parrilla
  if (/solomillo|ternera|hamburguesa|burger|chuletón|chuleton|entraña|entraña|secreto|presa|pollo|pato|albóndiga|albondiga|cordero|bacon|costilla|morcilla|chorizo|jamón|jamon|carpaccio/.test(textoCombinado)) {
    return 'Carnes & Parrilla';
  }

  // 6. Primeros & Sopas
  if (/sopa|crema|salmorejo|gazpacho|consomé|consome|potaje|guiso|puchero/.test(textoCombinado)) {
    return 'Primeros & Sopas';
  }

  // 7. Entrantes & Raciones (Fallback habitual)
  if (/croqueta|ensaladilla|bravas|tosta|brioche|tabla|ensalada|bao|empanada|nachos|hummus|edamame|pimiento|provolone/.test(textoCombinado)) {
    return 'Entrantes & Raciones';
  }

  // Fallback si nada coincide
  return 'Entrantes & Raciones';
}
