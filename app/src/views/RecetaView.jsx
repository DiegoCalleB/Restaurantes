import React from 'react';
import { ArrowLeft, Scale, Calculator, AlertTriangle, Trash2 } from 'lucide-react';

export default function RecetaView({ selectedPlatoId, setView, setSelectedId, platos = [], eliminarPlato }) {
  const p = platos.find(x => x.id === selectedPlatoId);
  
  if (!p) return null;

  const esMargenPeligroso = p.margenPct < 65;
  const recomendacionPVP = p.coste / 0.35; // Sugerir un precio para tener ~65% de margen
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div 
          onClick={() => setView('platos')}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <ArrowLeft size={16} /> Volver a Escandallos
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 5 }}>{p.nombre}</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>Análisis de rentabilidad basado en los precios medios de compra.</p>
        </div>
        <button 
          onClick={async () => {
            if (window.confirm("¿Seguro que quieres eliminar este escandallo? Esta acción no se puede deshacer.")) {
              const exito = await eliminarPlato(p.id);
              if (exito) setView('platos');
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--dangerSoft)', color: 'var(--danger)', border: '1px solid var(--danger)',
            padding: '10px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 2px 5px rgba(142, 38, 38, 0.05)'
          }}
        >
          <Trash2 size={16} /> Eliminar
        </button>
      </div>

      {esMargenPeligroso && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--dangerSoft)', border: '1px solid rgba(142, 38, 38, 0.2)', borderRadius: 14, padding: '15px 18px', marginBottom: 20 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--danger)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--danger)', marginBottom: 2 }}>
              ¡Alerta de Rentabilidad! Margen por debajo del 65% ideal.
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--danger)', opacity: 0.9 }}>
              Considera subir el precio en carta a unos <strong>€{recomendacionPVP.toFixed(2)}</strong> o negociar los precios de: {p.ingredientes.slice(0,2).map(i=>i.nombre).join(', ')}.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Receta e Ingredientes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>
            <Scale size={18} color="var(--accent)" />
            Ingredientes de la Receta
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 4px 8px' }}>
            <div>Ingrediente</div><div>Cantidad</div><div>Precio Ref.</div><div>Coste Real</div>
          </div>
          
          {p.ingredientes.map((it, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr 1fr', 
                padding: '11px 8px', 
                fontSize: 13.5, 
                alignItems: 'center', 
                borderBottom: '1px solid var(--bg)', 
                background: it.isAlert ? 'var(--dangerSoft)' : 'transparent', 
                borderRadius: it.isAlert ? 8 : 0,
                cursor: it.albaranId ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (it.albaranId) {
                  setSelectedId(it.albaranId);
                  setView('detalle');
                }
              }}
            >
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: it.isAlert ? 'var(--danger)' : 'inherit' }}>
                {it.nombre}
                {it.isAlert && <AlertTriangle size={12} strokeWidth={3} />}
              </div>
              <div>{it.cantidad} {it.unidad}</div>
              <div style={{ color: it.isAlert ? 'var(--danger)' : 'var(--textSoft)', fontWeight: it.isAlert ? 700 : 500 }}>
                €{it.precioReferencia.toFixed(2)}/{it.unidad}
                {it.isAlert && <span style={{ fontSize: 11, marginLeft: 4 }}> (↑{it.percentChange.toFixed(1)}%)</span>}
              </div>
              <div style={{ fontWeight: 800, color: it.isAlert ? 'var(--danger)' : 'inherit' }}>€{it.coste.toFixed(2)}</div>
            </div>
          ))}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 8px 4px', fontSize: 15, fontWeight: 900 }}>
            <div>Coste Total del Plato</div>
            <div>€{p.coste.toFixed(2)}</div>
          </div>
        </div>

        {/* Panel Financiero */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>
            <Calculator size={18} color="var(--accent)" />
            Resumen Financiero
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)', fontSize: 14 }}>
            <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Precio en Carta (PVP)</div>
            <div style={{ fontWeight: 800 }}>€{p.precioVenta.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)', fontSize: 14 }}>
            <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Coste de Materia Prima</div>
            <div style={{ fontWeight: 800 }}>€{p.coste.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)', fontSize: 14 }}>
            <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Margen Bruto (€)</div>
            <div style={{ fontWeight: 800, color: esMargenPeligroso ? 'var(--danger)' : 'var(--success)' }}>
              €{p.margenEuros.toFixed(2)}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 14 }}>
            <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Margen de Beneficio (%)</div>
            <div style={{ fontWeight: 900, fontSize: 16, color: esMargenPeligroso ? 'var(--danger)' : 'var(--success)' }}>
              {p.margenPct.toFixed(1)}%
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
