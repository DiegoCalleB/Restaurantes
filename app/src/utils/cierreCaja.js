/**
 * Módulo de Calculadora Express de Cierre de Caja
 * Calcula al instante la rentabilidad del día, el coste de materia prima estimado
 * y genera una síntesis inteligente para el dueño del restaurante al cerrar la jornada.
 */

export function calcularCierreCaja({ ventasBrutas = 0, platos = [] }) {
  const ventas = parseFloat(ventasBrutas) || 0;
  
  if (ventas <= 0) {
    return {
      ventasBrutas: 0,
      costeMateriaPrima: 0,
      margenEuros: 0,
      foodCostPct: 28,
      margenPct: 72,
      insight: 'Introduce las ventas totales del día para calcular tu margen bruto de hoy.'
    };
  }

  // Calcular Food Cost promedio de la carta activa
  const platosConEscandallo = (Array.isArray(platos) ? platos : []).filter(p => p.coste > 0 && (p.precio_venta || p.pvp) > 0);
  let foodCostPctMedio = 28; // Default objetivo de hostelería (28% food cost = 72% margen)

  if (platosConEscandallo.length > 0) {
    const sumaFoodCost = platosConEscandallo.reduce((s, p) => {
      const pvp = parseFloat(p.precio_venta || p.pvp) || 1;
      const coste = parseFloat(p.coste) || 0;
      return s + (coste / pvp) * 100;
    }, 0);
    foodCostPctMedio = Math.round((sumaFoodCost / platosConEscandallo.length) * 10) / 10;
  }

  const costeMateriaPrima = Math.round((ventas * (foodCostPctMedio / 100)) * 100) / 100;
  const margenEuros = Math.round((ventas - costeMateriaPrima) * 100) / 100;
  const margenPct = Math.round((100 - foodCostPctMedio) * 10) / 10;

  // Síntesis de ChefBot / IA
  let insight = '';
  if (margenPct >= 72) {
    insight = `🔥 ¡Jornada altamente rentable! Has generado ${margenEuros.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€ de margen limpio con un excelente Food Cost del ${foodCostPctMedio}%.`;
  } else if (margenPct >= 65) {
    insight = `✅ Buen cierre de caja. Tu margen bruto estimado es de ${margenEuros.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€ (${margenPct}% de margen sobre ventas).`;
  } else {
    insight = `⚠️ Cierre con presión sobre margen (${margenPct}%). Considera revisar las recetas de mayor venta para optimizar escandallos.`;
  }

  return {
    ventasBrutas: ventas,
    costeMateriaPrima: costeMateriaPrima,
    margenEuros: margenEuros,
    foodCostPct: foodCostPctMedio,
    margenPct: margenPct,
    insight: insight
  };
}
