import React, { useState } from 'react';
import { getInitials, getAvatarBg } from '../data';
import { Search, Filter, AlertTriangle, TrendingUp, TrendingDown, Star, MessageSquare, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProveedoresView({ isAdmin, proveedoresData = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  // Mock data para las gráficas
  const mockChartData = [
    { name: 'Ene', precio: 12.5 },
    { name: 'Feb', precio: 12.8 },
    { name: 'Mar', precio: 13.0 },
    { name: 'Abr', precio: 14.5 },
    { name: 'May', precio: 14.2 },
    { name: 'Jun', precio: 15.8 },
  ];
  return (
    <div>
      {/* VISTA DESKTOP (Grid de métricas de proveedores) */}
      <div className="hide-mobile" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '14px 22px', background: 'var(--bg)' }}>
          <div>Proveedor</div><div>Albaranes</div><div>Importe total</div><div>Incidencias</div><div>Var. precio</div><div>Puntualidad</div>
        </div>
        
        {proveedoresData.map((p, i) => {
          const incColor = p.incidenciasPct >= 8 ? 'var(--danger)' : p.incidenciasPct >= 3 ? 'var(--warning)' : 'var(--success)';
          const isExpanded = expandedId === p.id;
          
          return (
            <React.Fragment key={p.id || i}>
              <div 
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '14px 22px', borderTop: '1px solid var(--bg)', fontSize: 13.5, cursor: 'pointer', background: isExpanded ? 'var(--bg)' : 'transparent', transition: 'background 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: getAvatarBg(p.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{getInitials(p.nombre)}</div>
                  {p.nombre}
                </div>
                <div>{p.numAlbaranes}</div>
                <div style={{ fontWeight: 600 }}>€{p.importeTotal}</div>
                <div style={{ color: incColor, fontWeight: 800 }}>{p.incidenciasPct}%</div>
                <div style={{ fontWeight: 600, color: 'var(--danger)' }}>+{Math.floor(Math.random() * 15) + 2}%</div>
                <div>{p.puntualidad}%</div>
              </div>

              {/* Panel de Inteligencia de Negocio */}
              {isExpanded && (
                <div style={{ padding: '20px 40px', background: 'var(--bg)', borderTop: '1px dashed var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 40 }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 0, marginBottom: 16 }}>
                        <ChartIcon size={18} color="var(--accent)" /> 
                        Evolución de Precio: Producto Estrella
                      </h4>
                      <div style={{ height: 200, width: '100%', background: 'var(--surface)', padding: '20px 20px 20px 0', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={mockChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--textSoft)'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: 'var(--textSoft)'}} dx={-10} domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="precio" stroke="var(--accent)" strokeWidth={3} dot={{r: 4, fill: 'var(--accent)', strokeWidth: 0}} activeDot={{r: 6}} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div style={{ width: 280 }}>
                      <h4 style={{ marginTop: 0, marginBottom: 16 }}>Resumen de Negociación</h4>
                      <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 10px 0' }}>El precio base del <strong>Salmón Noruego</strong> ha subido un <strong>26%</strong> en los últimos 6 meses (de 12.50€ a 15.80€).</p>
                        <p style={{ margin: '0 0 10px 0' }}>Tu volumen de compra con {p.nombre} es de <strong>€{p.importeTotal}</strong>.</p>
                        <button style={{ width: '100%', padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                          Descargar Informe PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* VISTA MÓVIL (Tarjetas de proveedores colapsables) */}
      <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {proveedoresData.map((p, i) => {
          const incColor = p.incidenciasPct >= 8 ? 'var(--danger)' : p.incidenciasPct >= 3 ? 'var(--warning)' : 'var(--success)';
          const isExpanded = expandedId === p.id;

          return (
            <div 
              key={p.id || i}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                style={{ padding: 16, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: getAvatarBg(p.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                      {getInitials(p.nombre)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--textSoft)', fontWeight: 600 }}>{p.numAlbaranes} albaranes registrados</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>€{p.importeTotal}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
                      {isExpanded ? 'Ocultar detalles ▲' : 'Ver análisis ▼'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10, textAlign: 'center', fontSize: 11.5 }}>
                  <div>
                    <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Incidencias</div>
                    <div style={{ color: incColor, fontWeight: 800, fontSize: 13, marginTop: 2 }}>{p.incidenciasPct}%</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Subida pvp</div>
                    <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 13, marginTop: 2 }}>+12%</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Puntualidad</div>
                    <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: 13, marginTop: 2 }}>{p.puntualidad}%</div>
                  </div>
                </div>
              </div>

              {/* Análisis expandido en móvil */}
              {isExpanded && (
                <div style={{ padding: 16, borderTop: '1px dashed var(--border)', background: 'var(--bg)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 12px 0', fontSize: 13.5 }}>
                    <ChartIcon size={16} color="var(--accent)" /> Evolución de Precio (6 meses)
                  </h4>
                  <div style={{ height: 160, width: '100%', background: 'var(--surface)', padding: '12px 12px 12px 0', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--textSoft)'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--textSoft)'}} domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }} />
                        <Line type="monotone" dataKey="precio" stroke="var(--accent)" strokeWidth={2.5} dot={{r: 3, fill: 'var(--accent)'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <button className="btn btn-sm btn-primary w-full btn-touch">
                    Descargar Informe PDF
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
