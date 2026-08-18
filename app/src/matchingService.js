/**
 * matchingService.js
 * Algoritmos para normalizar y hacer matching de textos (Ej: "Lomo de Salmón Extra" -> "Salmón")
 */

// Función básica de distancia de Levenshtein
function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalize(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^a-z0-9]/g, ' ') // Solo letras y números
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Encuentra el mejor match para un string (ej. producto de albarán) 
 * dentro de un array de strings (el catálogo maestro).
 * Devuelve el objeto del catálogo o null.
 */
export function findBestMatch(targetStr, catalogObjects) {
  if (!targetStr || !catalogObjects || catalogObjects.length === 0) return null;
  
  const normTarget = normalize(targetStr);
  let bestMatch = null;
  let bestScore = 0;

  for (const item of catalogObjects) {
    const normItem = normalize(item.nombre);
    
    // 1. Matching exacto
    if (normTarget === normItem) return item;
    
    // 2. Substring (uno está contenido en el otro)
    if (normTarget.includes(normItem) || normItem.includes(normTarget)) {
      // Priorizamos los substrings más largos para evitar falsos positivos cortos
      const score = 0.8 + (normItem.length / 100); 
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }
    
    // 3. Levenshtein (Fuzzy)
    const distance = getLevenshteinDistance(normTarget, normItem);
    const maxLength = Math.max(normTarget.length, normItem.length);
    const similarity = 1 - (distance / maxLength);
    
    if (similarity > 0.65 && similarity > bestScore) {
      bestScore = similarity;
      bestMatch = item;
    }
  }
  
  return bestScore >= 0.65 ? bestMatch : null;
}
