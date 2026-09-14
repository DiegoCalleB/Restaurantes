import React, { useState } from 'react';
import { ChefHat, TrendingUp, TrendingDown, DollarSign, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SimuladorMenuView({ platos = [] }) {
  const [pvpMenu, setPvpMenu] = useState(14.50);
  const [plato1Id, setPlato1Id] = useState(platos[0]?.id || '');
  const [plato2Id, setPlato2Id] = useState(platos[1]?.id || (platos[0]?.id || ''));
  const [costeBebidaPostre, setCosteBebidaPostre] = useState(1.60); // Estimado medio de vino/agua + pan + postre

  const plato1 = platos.find(p => p.id === plato1Id) || platos[0];
  const plato2 = platos.find(p => p.id === plato2Id) || platos[1] || platos[0];

  const costePlato1 = plato1 ? plato1.coste : 0;
  const costePlato2 = plato2 ? plato2.coste : 0;
  const costeTotalMateriaPrima = costePlato1 + costePlato2 + (parseFloat(costeBebidaPostre) || 0);

  const margenEuros = pvpMenu - costeTotalMateriaPrima;
  const margenPct = pvpMenu > 0 ? (margenEuros / pvpMenu) * 100 : 0;

  const esPeligroso = margenPct < 60;
  const esAceptable = margenPct >= 60 && margenPct < 68;

  const estadoColor = esPeligroso ? 'var(--danger)' : esAceptable ? 'var(--warning)' : 'var(--success)';
  const estadoBg = esPeligroso ? 'var(--dangerSoft)' : esAceptable ? 'rgba(242, 201, 76, 0.1)' : 'var(--successSoft)';

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calculator size={26} style={{ color: 'var(--accent)' }} /> Simulador de Menú del Día
        </h2>
        <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>
          Calcula el coste real de materia prima y el margen neto ponderado según los platos elegidos por el comensal.
        </p>
      </div>

      <div className="split-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
        {/* PANEL DE CONFIGURACIÓN */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>Configura la combinación del comensal</h3>

          {/* PVP Menú */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', marginBottom: 6 }}>
              Precio de Venta del Menú del Día (€)
            </label>
            <input 
              type="number"
              step="0.50"
              value={pvpMenu}
              onChange={(e) => setPvpMenu(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 18, fontWeight: 800, color: 'var(--text)', outline: 'none'
              }}
            />
          </div>

          {/* Selector 1er Plato */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', marginBottom: 6 }}>
              1er Plato Elegido
            </label>
            <select
              value={plato1Id}
              onChange={(e) => setPlato1Id(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 14, fontWeight: 700, color: 'var(--text)', outline: 'none', cursor: 'pointer'
              }}
            >
              {platos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (Coste: €{p.coste.toFixed(2)})</option>
              ))}
            </select>
          </div>

          {/* Selector 2do Plato */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', marginBottom: 6 }}>
              2º Plato Elegido
            </label>
            <select
              value={plato2Id}
              onChange={(e) => setPlato2Id(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 14, fontWeight: 700, color: 'var(--text)', outline: 'none', cursor: 'pointer'
              }}
            >
              {platos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (Coste: €{p.coste.toFixed(2)})</option>
              ))}
            </select>
          </div>

          {/* Estimación Postre/Bebida/Pan */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', marginBottom: 6 }}>
              Coste Estimado Bebida + Pan + Postre (€)
            </label>
            <input 
              type="number"
              step="0.10"
              value={costeBebidaPostre}
              onChange={(e) => setCosteBebidaPostre(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--bg)',
                fontSize: 14, fontWeight: 700, color: 'var(--text)', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* PANEL RESULTADO Y SEMÁFORO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: estadoBg, border: `1.5px solid ${estadoColor}`, borderRadius: 16, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: estadoColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Rentabilidad del Menú
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: estadoColor, fontWeight: 800, fontSize: 14 }}>
                {esPeligroso ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                {esPeligroso ? 'ZONA DE PELIGRO' : esAceptable ? 'MARGEN ACEPTEABLE' : 'MENÚ RENTABLE'}
              </div>
            </div>

            <div style={{ fontSize: 36, fontWeight: 900, color: estadoColor, marginBottom: 4 }}>
              {margenPct.toFixed(1)}%
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: 600 }}>
              Margen bruto ganado por menú: <strong>€{margenEuros.toFixed(2)}</strong>
            </div>
          </div>

          {/* DESGLOSE DE COSTES */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: 'var(--textSoft)', marginBottom: 14 }}>
              Desglose por comensal
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg)', fontSize: 13.5 }}>
              <span>1er Plato ({plato1?.nombre || 'Plato 1'})</span>
              <span style={{ fontWeight: 700 }}>€{costePlato1.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg)', fontSize: 13.5 }}>
              <span>2º Plato ({plato2?.nombre || 'Plato 2'})</span>
              <span style={{ fontWeight: 700 }}>€{costePlato2.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg)', fontSize: 13.5 }}>
              <span>Pan, Bebida y Postre</span>
              <span style={{ fontWeight: 700 }}>€{parseFloat(costeBebidaPostre || 0).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>
              <span>Coste Total Materia Prima</span>
              <span style={{ color: 'var(--danger)' }}>€{costeTotalMateriaPrima.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
