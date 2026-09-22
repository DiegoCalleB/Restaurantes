import React, { useState } from 'react';
import { ChefHat, TrendingUp, TrendingDown, Eye, AlertTriangle, Info, Trash2, Camera, UploadCloud, Loader2, LayoutGrid, List, Plus, Edit, Clock } from 'lucide-react';
import EditarEscandalloModal from './EditarEscandalloModal';
import { evaluarDietaPlato } from '../utils/dietaService';

const LISTA_CATEGORIAS = [
  'Entrantes & Raciones',
  'Primeros & Sopas',
  'Pastas & Arroces',
  'Carnes & Parrilla',
  'Pescados & Mariscos',
  'Postres Caseros',
  'Bebidas & Bodega',
  'Otros'
];

export default function PlatosView({ platos = [], setView, setSelectedPlatoId, eliminarPlato, actualizarPvpPlato, actualizarImagenPlato, actualizarCategoriaPlato, ingredientesBase = [], actualizarEscandalloCompleto }) {
  const [uploadingId, setUploadingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'table'
  const [platoAEditar, setPlatoAEditar] = useState(null);
  const platosConAlerta = platos.filter(p => p.hasAlert);

  const handleFileChange = async (platoId, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingId(platoId);
    try {
      if (actualizarImagenPlato) {
        await actualizarImagenPlato(platoId, file);
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* CABECERA GENERAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 4, color: 'var(--text)' }}>Escandallos & Catálogo de Platos</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 13.5, margin: 0 }}>
            Gestión visual del menú, imágenes de los platos y rentabilidad en tiempo real
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* SELECTOR DE MODO DE VISTA (GRID / TABLA) */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--textSoft)',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <LayoutGrid size={15} /> Mosaico / Fotos
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--textSoft)',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <List size={15} /> Vista Lista
            </button>
          </div>

          <button 
            onClick={() => setView('subir_carta')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Importar Carta (IA)
          </button>

          <button 
            onClick={() => setView('nuevo_escandallo')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', color: '#fff', border: 'none',
              padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)'
            }}
          >
            <Plus size={16} /> Nuevo Escandallo
          </button>
        </div>
      </div>

      {/* ALERTAS */}
      {platosConAlerta.length > 0 && (
        <div style={{ background: 'var(--dangerSoft)', border: '1px solid var(--danger)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--danger)', fontSize: 14.5, fontWeight: 800 }}>Subidas de Precio Detectadas en Ingredientes</h4>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.4 }}>
              Ingredientes clave en <strong>{platosConAlerta.length} plato{platosConAlerta.length !== 1 ? 's' : ''}</strong> han subido de precio. Se sugieren ajustes de PVP en carta para mantener el 70% de margen.
            </p>
          </div>
        </div>
      )}

      {/* BLOQUES DE CATEGORÍAS */}
      {(() => {
        const grouped = platos.reduce((acc, p) => {
          const cat = p.categoria || 'Otros';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(p);
          return acc;
        }, {});

        const ORDEN_GASTRONOMICO = [
          'Entrantes & Raciones', 'Entrantes',
          'Primeros & Sopas', 'Primeros',
          'Pastas & Arroces',
          'Carnes & Parrilla', 'Carnes', 'Principales',
          'Pescados & Mariscos', 'Pescados',
          'Postres Caseros', 'Postres',
          'Bebidas & Bodega', 'Bebidas'
        ];

        const ICONOS_CATEGORIA = {
          'Entrantes & Raciones': '🧆', 'Entrantes': '🧆',
          'Primeros & Sopas': '🥣', 'Primeros': '🥣',
          'Pastas & Arroces': '🥘',
          'Carnes & Parrilla': '🥩', 'Carnes': '🥩', 'Principales': '🥩',
          'Pescados & Mariscos': '🐟', 'Pescados': '🐟',
          'Postres Caseros': '🍰', 'Postres': '🍰',
          'Bebidas & Bodega': '🍷', 'Bebidas': '🍷'
        };

        const categorias = Object.keys(grouped).sort((a, b) => {
          let idxA = ORDEN_GASTRONOMICO.findIndex(c => c.toLowerCase() === a.toLowerCase());
          let idxB = ORDEN_GASTRONOMICO.findIndex(c => c.toLowerCase() === b.toLowerCase());
          if (idxA === -1) idxA = 99;
          if (idxB === -1) idxB = 99;
          return idxA - idxB;
        });

        if (categorias.length === 0) {
          return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--textSoft)', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
              No hay platos configurados en la carta.
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {categorias.map(cat => {
              const platosCat = grouped[cat].sort((a, b) => (a.orden || 999) - (b.orden || 999));
              const iconoCat = ICONOS_CATEGORIA[cat] || '🍽️';

              return (
                <div key={cat} style={{ width: '100%' }}>
                  {/* HEADER DE CATEGORÍA ELEGANTE */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingBottom: 12, marginBottom: 16, borderBottom: '2px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{iconoCat}</span>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {cat}
                      </h3>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                        background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', border: '1px solid rgba(217, 119, 6, 0.3)'
                      }}>
                        {platosCat.length} plato{platosCat.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* VISTA EN TARJETAS / GRID (APROVECHA TODO EL ANCHO DE LA PANTALLA) */}
                  {viewMode === 'grid' ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
                      gap: 20,
                      width: '100%'
                    }}>
                      {platosCat.map(p => {
                        const esMargenPeligroso = p.margenPct < 65;
                        const margenColor = esMargenPeligroso ? 'var(--danger)' : 'var(--success)';
                        const margenBg = esMargenPeligroso ? 'var(--dangerSoft)' : 'var(--successSoft)';

                        return (
                          <div
                            key={p.id}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 18,
                              overflow: 'hidden',
                              boxShadow: 'var(--shadow-sm)',
                              display: 'flex',
                              flexDirection: 'column',
                              justify: 'space-between',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                              position: 'relative'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                          >
                            {/* FOTO GRANDE CABECERA CON BOTÓN SUBIDA */}
                            <div style={{ width: '100%', height: 160, position: 'relative', background: '#000' }}>
                              <img 
                                src={p.imagen_url || p.imagenUrl} 
                                alt={p.nombre} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />

                              {/* ALERTA SOBRE LA FOTO */}
                              {p.hasAlert && (
                                <div style={{
                                  position: 'absolute', top: 10, left: 10,
                                  background: 'var(--danger)', color: '#fff',
                                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                                  display: 'flex', alignItems: 'center', gap: 4
                                }}>
                                  ⚠️ Subida coste
                                </div>
                              )}

                              {/* BOTÓN VISIBLE SUBIR FOTO */}
                              <label style={{
                                position: 'absolute', bottom: 10, right: 10,
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 8,
                                background: 'rgba(0, 0, 0, 0.75)',
                                backdropFilter: 'blur(4px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff', fontSize: 11.5, fontWeight: 700,
                                cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                              }}>
                                {uploadingId === p.id ? (
                                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Camera size={13} />
                                )}
                                <span>{uploadingId === p.id ? 'Subiendo...' : '📷 Cambiar Foto'}</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => handleFileChange(p.id, e)}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>

                            {/* CUERPO DE LA TARJETA */}
                            <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                  <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                                      {p.nombre}
                                    </h4>
                                    
                                     {/* SELECTOR DE EDICIÓN DE CATEGORÍA Y TIEMPO DE PREPARACIÓN */}
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                                       <select
                                         value={p.categoria || 'Otros'}
                                         onChange={async (e) => {
                                           const nuevaCat = e.target.value;
                                           if (actualizarCategoriaPlato) {
                                             await actualizarCategoriaPlato(p.id, nuevaCat);
                                           }
                                         }}
                                         style={{
                                           fontSize: 11, fontWeight: 700,
                                           background: 'rgba(217, 119, 6, 0.12)',
                                           border: '1px solid rgba(217, 119, 6, 0.25)',
                                           color: '#d97706',
                                           borderRadius: 6,
                                           padding: '2px 6px',
                                           outline: 'none',
                                           cursor: 'pointer'
                                         }}
                                       >
                                         {LISTA_CATEGORIAS.map(c => (
                                           <option key={c} value={c}>{c}</option>
                                         ))}
                                       </select>

                                       <span style={{
                                         fontSize: 11, fontWeight: 700,
                                         background: 'var(--bg)',
                                         border: '1px solid var(--border)',
                                         color: 'var(--textSoft)',
                                         borderRadius: 6,
                                         padding: '2px 6px',
                                         display: 'inline-flex', alignItems: 'center', gap: 3
                                       }} title="Tiempo estimado de preparación">
                                         <Clock size={11} /> {p.tiempo_preparacion || p.tiempoPreparacion || 15} min
                                       </span>

                                       {(() => {
                                         const { esVegetariano, esVegano } = evaluarDietaPlato(p);
                                         if (esVegano) return <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 6, padding: '2px 6px' }}>🌿 Vegano</span>;
                                         if (esVegetariano) return <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(52, 211, 153, 0.12)', color: 'var(--success)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: 6, padding: '2px 6px' }}>🌱 Vegetariano</span>;
                                         return null;
                                       })()}
                                     </div>
                                   </div>
                                   <div style={{ fontSize: 18, fontWeight: 900, color: '#d97706', whiteSpace: 'nowrap' }}>
                                     €{(p.precioVenta || p.precio_venta || 0).toFixed(2)}
                                   </div>
                                 </div>

                                 {esMargenPeligroso && p.pvpRecomendado > (p.precioVenta || 0) && (
                                   <button
                                     onClick={async () => {
                                       if (actualizarPvpPlato && window.confirm(`¿Ajustar PVP de '${p.nombre}' a €${p.pvpRecomendado.toFixed(2)}?`)) {
                                         await actualizarPvpPlato(p.id, p.pvpRecomendado);
                                       }
                                     }}
                                     style={{
                                       width: '100%', marginBottom: 12,
                                       background: 'var(--dangerSoft)', color: 'var(--danger)',
                                       border: '1px solid var(--danger)', borderRadius: 8,
                                       fontSize: 11, fontWeight: 800, padding: '4px 8px',
                                       cursor: 'pointer', textAlign: 'center'
                                     }}
                                   >
                                     💡 Sugerido: €{p.pvpRecomendado.toFixed(2)} (para 70% margen)
                                   </button>
                                 )}
                               </div>

                               {/* METRICAS DE COSTES Y MARGEN */}
                               <div style={{
                                 background: 'var(--bg)', borderRadius: 12, padding: '10px 12px',
                                 display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0 14px'
                               }}>
                                 <div>
                                   <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase' }}>Coste Materia Prima</div>
                                   <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>€{p.coste.toFixed(2)}</div>
                                 </div>
                                 <div style={{ textAlign: 'right' }}>
                                   <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase' }}>Margen Bruto</div>
                                   <span style={{ color: margenColor, fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                     {esMargenPeligroso ? <TrendingDown size={13}/> : <TrendingUp size={13}/>}
                                     {p.margenPct.toFixed(1)}%
                                   </span>
                                 </div>
                               </div>

                               {/* BOTONES DE ACCIÓN DE LA TARJETA */}
                               <div style={{ display: 'flex', gap: 6 }}>
                                 <button
                                   onClick={() => setPlatoAEditar(p)}
                                   style={{
                                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                     background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', border: 'none',
                                     color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                     boxShadow: '0 2px 8px rgba(59, 110, 165, 0.25)'
                                   }}
                                   title="Editar ingredientes y receta con IA"
                                 >
                                   <Edit size={13} /> Receta (IA)
                                 </button>
                                 <button
                                   onClick={() => { setSelectedPlatoId(p.id); setView('receta'); }}
                                   style={{
                                     flex: 1,
                                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                     background: 'var(--surface)', border: '1px solid var(--border)',
                                     color: 'var(--text)', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer'
                                   }}
                                 >
                                   Ver →
                                 </button>
                                 <button 
                                   onClick={async () => {
                                     if (eliminarPlato && window.confirm("¿Eliminar este escandallo?")) {
                                       await eliminarPlato(p.id);
                                     }
                                   }}
                                   style={{ background: 'var(--dangerSoft)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}
                                   title="Eliminar plato"
                                 >
                                   <Trash2 size={15} />
                                 </button>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* VISTA TABLA CLÁSICA */
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                      <div className="scroll-x">
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 760 }}>
                        <thead>
                          <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase' }}>
                            <th style={{ padding: '12px 20px', width: '35%' }}>Plato</th>
                            <th style={{ padding: '12px 14px', width: '25%' }}>Foto (Gestión)</th>
                            <th style={{ padding: '12px 14px' }}>Coste Ingredientes</th>
                            <th style={{ padding: '12px 14px' }}>PVP Carta</th>
                            <th style={{ padding: '12px 14px' }}>Margen</th>
                            <th style={{ padding: '12px 20px', textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {platosCat.map(p => {
                            const esMargenPeligroso = p.margenPct < 65;
                            const margenColor = esMargenPeligroso ? 'var(--danger)' : 'var(--success)';
                            const margenBg = esMargenPeligroso ? 'var(--dangerSoft)' : 'var(--successSoft)';

                            return (
                              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '14px 20px', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>
                                  <div>{p.nombre}</div>
                                  <div style={{ marginTop: 4 }}>
                                    <select
                                      value={p.categoria || 'Otros'}
                                      onChange={async (e) => {
                                        const nuevaCat = e.target.value;
                                        if (actualizarCategoriaPlato) {
                                          await actualizarCategoriaPlato(p.id, nuevaCat);
                                        }
                                      }}
                                      style={{
                                        fontSize: 11, fontWeight: 700,
                                        background: 'rgba(217, 119, 6, 0.12)',
                                        border: '1px solid rgba(217, 119, 6, 0.25)',
                                        color: '#d97706',
                                        borderRadius: 6,
                                        padding: '2px 6px',
                                        outline: 'none',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {LISTA_CATEGORIAS.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <img src={p.imagen_url || p.imagenUrl} alt={p.nombre} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                      <Camera size={12} /> Subir Foto
                                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(p.id, e)} style={{ display: 'none' }} />
                                    </label>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 14px', fontWeight: 600 }}>€{p.coste.toFixed(2)}</td>
                                <td style={{ padding: '14px 14px', fontWeight: 800 }}>€{(p.precioVenta || p.precio_venta || 0).toFixed(2)}</td>
                                <td style={{ padding: '14px 14px' }}>
                                  <span style={{ color: margenColor, background: margenBg, padding: '4px 8px', borderRadius: 12, fontSize: 11.5, fontWeight: 800 }}>
                                    {p.margenPct.toFixed(1)}%
                                  </span>
                                </td>
                                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                  <button onClick={() => { setSelectedPlatoId(p.id); setView('receta'); }} style={{ padding: '5px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                                    Ver receta →
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                   )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* MODAL DE EDICIÓN DE RECETA CON IA */}
      <EditarEscandalloModal 
        plato={platoAEditar} 
        ingredientesBase={ingredientesBase} 
        isOpen={!!platoAEditar} 
        onClose={() => setPlatoAEditar(null)} 
        onGuardar={actualizarEscandalloCompleto} 
      />
    </div>
  );
}
