/**
 * Módulo de Detección de Alertas de Margen y Food Cost
 * Analiza el impacto de las subidas de precios de proveedores sobre los escandallos
 * y detecta platos cuyo margen cae por debajo del umbral objetivo (ej. < 65%).
 */

export function calcularAnalisisMargenPlato(plato, ingredientesBase = []) {
  if (!plato) return null;

  const pvp = parseFloat(plato.precio_venta || plato.pvp) || 0;
  const escandallo = Array.isArray(plato.escandallo) ? plato.escandallo : [];

  let costeTotalMateriaPrima = 0;
  const desgloseIngredientes = [];

  escandallo.forEach(item => {
    // Buscar ingrediente base maestro por ID o nombre
    const ingBase = ingredientesBase.find(i => 
      (i.id && i.id === item.ingrediente_id) || 
      (i.nombre && item.nombre && i.nombre.toLowerCase().trim() === item.nombre.toLowerCase().trim())
    );

    const precioUnitario = parseFloat(ingBase?.precio_estimado || item.precio_unitario || item.precio) || 0;
    const cantidad = parseFloat(item.cantidad) || 0;
    const costeItem = cantidad * precioUnitario;

    costeTotalMateriaPrima += costeItem;

    desgloseIngredientes.push({
      nombre: item.nombre || ingBase?.nombre || 'Ingrediente',
      cantidad: cantidad,
      unidad: item.unidad || ingBase?.unidad_medida || 'kg',
      precioUnitario: precioUnitario,
      costeItem: costeItem,
      ingredienteBaseId: ingBase?.id
    });
  });

  const foodCostPct = pvp > 0 ? (costeTotalMateriaPrima / pvp) * 100 : 0;
  const margenPct = 100 - foodCostPct;
  const beneficioEuros = Math.max(0, pvp - costeTotalMateriaPrima);

  return {
    platoId: plato.id,
    platoNombre: plato.nombre,
    pvp: pvp,
    costeTotal: costeTotalMateriaPrima,
    foodCostPct: Math.round(foodCostPct * 10) / 10,
    margenPct: Math.round(margenPct * 10) / 10,
    beneficioEuros: Math.round(beneficioEuros * 100) / 100,
    desglose: desgloseIngredientes
  };
}

/**
 * Obtiene el listado global de alertas de riesgo de margen en la carta.
 * @param {Array} platos - Lista de platos/escandallos
 * @param {Array} ingredientesBase - Catálogo de ingredientes base
 * @param {number} umbralMargenMinimo - Margen mínimo aceptable (defecto 65%)
 * @returns {Array} Listado de alertas ordenadas por gravedad
 */
export function detectarAlertasMargen(platos = [], ingredientesBase = [], umbralMargenMinimo = 65) {
  if (!Array.isArray(platos)) return [];

  const alertas = [];

  platos.forEach(plato => {
    const analisis = calcularAnalisisMargenPlato(plato, ingredientesBase);
    if (!analisis || analisis.pvp <= 0) return;

    // Detectar si el margen está por debajo del umbral deseado
    if (analisis.margenPct < umbralMargenMinimo) {
      // Encontrar el ingrediente de mayor coste relativo en el plato
      const ingredienteCritico = [...analisis.desglose].sort((a, b) => b.costeItem - a.costeItem)[0];

      alertas.push({
        id: `alert-${plato.id}`,
        platoId: plato.id,
        platoNombre: plato.nombre,
        pvp: analisis.pvp,
        costeTotal: analisis.costeTotal,
        margenActual: analisis.margenPct,
        foodCostActual: analisis.foodCostPct,
        umbralObjetivo: umbralMargenMinimo,
        diferenciaMargen: Math.round((umbralMargenMinimo - analisis.margenPct) * 10) / 10,
        ingredienteCritico: ingredienteCritico ? ingredienteCritico.nombre : 'Materia Prima',
        costeIngredienteCritico: ingredienteCritico ? ingredienteCritico.costeItem : 0,
        nivelRiesgo: analisis.margenPct < 50 ? 'critico' : 'advertencia', // critico (<50%), advertencia (<65%)
        mensaje: `El margen de "${plato.nombre}" ha caído al ${analisis.margenPct}% (Objetivo: ${umbralMargenMinimo}%) impulsado por el coste de ${ingredienteCritico?.nombre || 'ingredientes'}.`
      });
    }
  });

  return alertas.sort((a, b) => a.margenActual - b.margenActual);
}
