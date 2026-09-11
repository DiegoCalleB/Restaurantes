import React, { useState } from 'react';
import { ChefHat, TrendingUp, TrendingDown, Eye, AlertTriangle, Info, Trash2 } from 'lucide-react';

export default function PlatosView({ platos = [], setView, setSelectedPlatoId, eliminarPlato, actualizarPvpPlato }) {
  const platosConAlerta = platos.filter(p => p.hasAlert);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 5 }}>Escandallos y Rentabilidad</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>Costes calculados en base al <strong>último albarán</strong> recibido de cada ingrediente.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={() => setView('subir_carta')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
              padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 5px rgba(20, 15, 10, 0.05)'
            }}
          >
            + Importar Carta (IA)
          </button>
          <button 
            onClick={() => setView('nuevo_escandallo')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 110, 165, 0.3)'
            }}
          >
            + Nuevo Escandallo
          </button>
        </div>
      </div>

      {platosConAlerta.length > 0 && (
        <div style={{ background: 'var(--dangerSoft)', border: '1px solid var(--danger)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--danger)', fontSize: 15 }}>Alertas de Precio Activas</h4>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13.5, lineHeight: 1.5 }}>
              Hemos detectado subidas superiores al 5% en ingredientes clave que afectan directamente a la rentabilidad de <strong>{platosConAlerta.length} plato{platosConAlerta.length !== 1 ? 's' : ''}</strong> de tu carta. Revisa los escandallos marcados para ver el impacto.
            </p>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '14px 22px', background: 'var(--bg)' }}>
          <div>Plato</div><div>Coste (Ingredientes)</div><div>PVP (Carta)</div><div>Margen Bruto</div><div></div>
        </div>
        
        {(() => {
          // Agrupar por categoría
          const grouped = platos.reduce((acc, p) => {
            const cat = p.categoria || 'Otros';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(p);
            return acc;
          }, {});

          // Ordenar categorías (Podemos poner Entrantes primero, etc, pero de momento alfabético o como lleguen, salvo Otros al final)
          const categorias = Object.keys(grouped).sort((a, b) => {
            if (a === 'Otros') return 1;
            if (b === 'Otros') return -1;
            return a.localeCompare(b);
          });

          return categorias.map(cat => {
            // Ordenar platos dentro de la categoría
            const platosCat = grouped[cat].sort((a, b) => (a.orden || 999) - (b.orden || 999));
            
            return (
              <React.Fragment key={cat}>
                {/* Cabecera de Categoría */}
                <div style={{ background: 'var(--bg)', padding: '10px 22px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {cat}
                </div>
                
                {/* Platos de la categoría */}
                {platosCat.map(p => {
                  const esMargenPeligroso = p.margenPct < 65;
                  const margenColor = esMargenPeligroso ? 'var(--danger)' : 'var(--success)';
                  const margenBg = esMargenPeligroso ? 'var(--dangerSoft)' : 'var(--successSoft)';

                  return (
                    <div 
                      key={p.id}
                      onClick={() => { setSelectedPlatoId(p.id); setView('receta'); }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--bg)', cursor: 'pointer', fontSize: 13.5 }}
                    >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, fontSize: 14.5 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--bg), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
                  <ChefHat size={18} />
                </div>
                {p.nombre}
                {p.hasAlert && (
                  <span title="Este plato contiene ingredientes que han subido de precio repentinamente" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'var(--danger)', color: '#fff' }}>
                    <AlertTriangle size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              
              <div style={{ fontWeight: 600, color: 'var(--textSoft)' }}>
                €{p.coste.toFixed(2)}
              </div>
              
              <div style={{ fontWeight: 800, display: 'flex', flexDirection: 'column' }}>
                <span>€{p.precioVenta.toFixed(2)}</span>
                {esMargenPeligroso && p.pvpRecomendado > p.precioVenta && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (actualizarPvpPlato && window.confirm(`¿Subir PVP de '${p.nombre}' a €${p.pvpRecomendado.toFixed(2)} para recuperar el 70% de margen?`)) {
                        await actualizarPvpPlato(p.id, p.pvpRecomendado);
                      }
                    }}
                    style={{
                      background: 'var(--dangerSoft)', color: 'var(--danger)',
                      border: '1px solid var(--danger)', borderRadius: 6,
                      fontSize: 10.5, fontWeight: 800, padding: '2px 6px',
                      marginTop: 4, cursor: 'pointer', textAlign: 'left', width: 'max-content'
                    }}
                    title="Haz clic para aplicar la sugerencia de PVP y recuperar un 70% de margen"
                  >
                    💡 Sugerido: €{p.pvpRecomendado.toFixed(2)}
                  </button>
                )}
              </div>
              
              <div>
                <span style={{ color: margenColor, background: margenBg, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, width: 'max-content' }}>
                  {esMargenPeligroso ? <TrendingDown size={14}/> : <TrendingUp size={14}/>}
                  {p.margenPct.toFixed(1)}% (M: €{p.margenEuros.toFixed(2)})
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12.5, textAlign: 'right' }}>Ver receta →</div>
                <div 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (eliminarPlato && window.confirm("¿Seguro que quieres eliminar este escandallo?")) {
                      await eliminarPlato(p.id);
                    }
                  }}
                  style={{ color: 'var(--danger)', padding: 4, display: 'flex' }}
                  title="Eliminar plato"
                >
                  <Trash2 size={14} />
                </div>
              </div>
            </div>
                  );
                })}
              </React.Fragment>
            );
          });
        })()}

        {platos.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--textSoft)' }}>
            No hay platos configurados o no se han cargado desde Supabase.
          </div>
        )}
      </div>
    </div>
  );
}
