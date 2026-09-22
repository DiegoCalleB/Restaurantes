/**
 * Módulo de Fuzzy Matching (Coincidencia Difusa de Cadenas)
 * Compara los productos de un albarán escaneado contra el catálogo de ingredientes base.
 */

// Normalizar cadena: minúsculas, sin acentos ni términos de embalaje/peso comunes
function normalizarTexto(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/\b(\d+([.,]\d+)?\s*(kg|g|l|ml|cl|unidad|unidades|ud|uds|caja|cajas|pack|bolsa|lata|botella|botellas|1a|2a|extra))\b/g, '') // Quitar pesos/formatos
    .replace(/[^a-z0-9\s]/g, ' ') // Quitar caracteres especiales
    .replace(/\s+/g, ' ')
    .trim();
}

// Cálculo del Coeficiente Sørensen-Dice sobre pares de caracteres (bigramas)
function diceCoefficient(str1, str2) {
  const s1 = normalizarTexto(str1);
  const s2 = normalizarTexto(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  // Si una cadena contiene exactamente a la otra como palabra completa
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const exactWordMatch = words2.some(w => w.length > 2 && words1.includes(w)) || words1.some(w => w.length > 2 && words2.includes(w));
  
  // Generar bigramas
  const getBigrams = (string) => {
    const bigrams = new Set();
    for (let i = 0; i < string.length - 1; i++) {
      bigrams.add(string.substring(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  if (bg1.size === 0 || bg2.size === 0) return 0;

  let intersection = 0;
  bg1.forEach(b => {
    if (bg2.has(b)) intersection++;
  });

  const diceScore = (2.0 * intersection) / (bg1.size + bg2.size);
  
  // Dar un bonus si hay coincidencia de palabra clave principal
  return exactWordMatch ? Math.min(1.0, diceScore + 0.35) : diceScore;
}

/**
 * Sugiere los ingredientes base del catálogo más probables para un producto de albarán.
 * @param {string} nombreProducto - Ej: "Tomate Canario 1ª Bolsa 5kg"
 * @param {Array} ingredientesBase - Array de objetos [{ id, nombre, ... }]
 * @param {number} maxResultados - Máximo número de candidatos a devolver (por defecto 3)
 * @returns {Array} Listado de candidatos ordenados por puntuación [{ ingrediente, score, scorePct }]
 */
export function sugerirIngredienteBase(nombreProducto, ingredientesBase = [], maxResultados = 3) {
  if (!nombreProducto || !Array.isArray(ingredientesBase) || ingredientesBase.length === 0) {
    return [];
  }

  const candidatos = ingredientesBase
    .map(ing => {
      const score = diceCoefficient(nombreProducto, ing.nombre);
      return {
        ingrediente: ing,
        id: ing.id,
        nombre: ing.nombre,
        score: score,
        scorePct: Math.round(score * 100)
      };
    })
    .filter(c => c.score > 0.15) // Filtrar coincidencias irrelevantes
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResultados);

  return candidatos;
}
