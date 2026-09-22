import { deducirCategoriaPlato } from './categoriaService';

/**
 * Evalúa si un plato es apto para dieta Vegetariana (🌱) o Vegana (🌿)
 * analizando su categoría, nombre e ingredientes.
 */
export function evaluarDietaPlato(plato) {
  if (!plato) return { esVegetariano: false, esVegano: false };

  const categoriaDeducida = (plato.categoria && plato.categoria !== 'Otros' && plato.categoria !== 'Principal')
    ? plato.categoria
    : deducirCategoriaPlato(plato.nombre, plato.ingredientes);

  const textoCombinado = [
    plato.nombre || '',
    categoriaDeducida || '',
    ...(plato.ingredientes || []).map(i => typeof i === 'string' ? i : (i.nombre || ''))
  ].join(' ').toLowerCase();

  // Detección explícita de alternativa vegetariana/vegana
  const esExplicitoVegano = /vegana|vegano|plant-based|plant based|beyond|heura|imposible|not burger|sin carne|100% vegetal/.test(textoCombinado);
  const esExplicitoVegetariano = esExplicitoVegano || /vegetariana|vegetariano/.test(textoCombinado);

  // Palabras clave de carne, ave, embutido y casquería
  const esCarne = /hamburguesa|burger|carne|picada|solomillo|ternera|vaca|buey|cerdo|cochinillo|lomo|entrecot|chuleton|chuletón|chuleta|costilla|albondiga|albóndiga|secreto|presa|carrillada|carrillera|salchicha|chistorra|butifarra|compango|panceta|torrezno|cecina|sobrasada|foie|pato|molleja|rabo|tartar|carpaccio|caza|venado|ciervo|corzo|jabalí|conejo|pollo|pavo|codorniz|perdigon|perdigón|jamon|jamón|bacon|baicon|morcilla|chorizo|chacina|embutido|serrano|iberico|ibérico|carnes & parrilla|carnes y parrilla/.test(textoCombinado);

  // Palabras clave de pescado y marisco
  const esPescadoOMarisco = /pescado|sardina|merluza|bacalao|atun|atún|bonito|salmon|salmón|anchoa|lubina|dorada|gamba|gambas|langostino|marisco|mejillon|mejillón|almeja|pulpo|calamar|chipiron|chipirón|ostra|ensaladilla rusa|tataki|sashimi|sushi|cebiche|ceviche|pescados & mariscos|pescados y mariscos/.test(textoCombinado);

  // Comprobar la categoría explícita
  const categoriaEsCarneOPescado = /carnes|pescados/.test((categoriaDeducida || '').toLowerCase());

  const tieneCarneOPescado = (esCarne || esPescadoOMarisco || categoriaEsCarneOPescado) && !esExplicitoVegetariano;

  // Lácteos, Huevos u origen animal derivado
  const tieneLacteosOHuevos = /queso|leche|nata|mantequilla|crema|bechamel|yogur|huevo|mayonesa|alioli|tortilla|huancaína|huancaina|miel|suero/.test(textoCombinado) || (plato.alergenos || []).some(a => a === 'lacteos' || a === 'huevos');

  const esVegetariano = esExplicitoVegetariano || !tieneCarneOPescado;
  const esVegano = (esExplicitoVegano || esVegetariano) && !tieneLacteosOHuevos && !tieneCarneOPescado;

  return { esVegetariano, esVegano };
}
