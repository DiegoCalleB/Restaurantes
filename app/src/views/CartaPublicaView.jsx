import React, { useState, useMemo } from 'react';
import { Search, Sparkles, AlertTriangle, ShieldCheck, Flame, UtensilsCrossed, Wine, Coffee, ChefHat, Info, Filter, ArrowLeft } from 'lucide-react';
import { evaluarDietaPlato } from '../utils/dietaService';

const ALERGENO_MAP = {
  gluten: { icon: '🌾', label: 'Gluten', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  lacteos: { icon: '🥛', label: 'Lácteos', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.3)' },
  huevos: { icon: '🥚', label: 'Huevos', color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.3)' },
  pescado: { icon: '🐟', label: 'Pescado', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' },
  crustaceos: { icon: '🦐', label: 'Crustáceos', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)' },
  marisco: { icon: '🦐', label: 'Marisco', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)', border: 'rgba(248, 113, 113, 0.3)' },
  moluscos: { icon: '🦪', label: 'Moluscos', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)' },
  frutos_secos: { icon: '🌰', label: 'Frutos Secos', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.3)' },
  cacahuetes: { icon: '🥜', label: 'Cacahuetes', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.3)' },
  soja: { icon: '🫘', label: 'Soja', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.3)' },
  apio: { icon: '🥬', label: 'Apio', color: '#86efac', bg: 'rgba(134, 239, 172, 0.15)', border: 'rgba(134, 239, 172, 0.3)' },
  mostaza: { icon: '🟡', label: 'Mostaza', color: '#facc15', bg: 'rgba(250, 204, 21, 0.15)', border: 'rgba(250, 204, 21, 0.3)' },
  sesamo: { icon: '⚪', label: 'Sésamo', color: '#e2e8f0', bg: 'rgba(226, 232, 240, 0.15)', border: 'rgba(226, 232, 240, 0.3)' },
  sulfitos: { icon: '🍷', label: 'Sulfitos', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)' },
  altramuces: { icon: '🌼', label: 'Altramuces', color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.3)' },
};

function getAlergenoConfig(alName) {
  if (!alName) return { icon: '🍽️', label: alName, color: '#9ca3af', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)' };
  const key = alName.toLowerCase().trim().replace(/\s+/g, '_');
  if (ALERGENO_MAP[key]) return ALERGENO_MAP[key];

  for (const [k, config] of Object.entries(ALERGENO_MAP)) {
    if (key.includes(k) || k.includes(key)) return config;
  }

  return { icon: '🍽️', label: alName, color: '#d1d5db', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)' };
}

export default function CartaPublicaView({ restaurantes = [], platos = [], selectedRestauranteId = null, onVolverAlPanel }) {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAlergeno, setFilterAlergeno] = useState('Todos');
  const [filtroDieta, setFiltroDieta] = useState('todos'); // 'todos', 'vegetariano', 'vegano'
  const [selectedPlato, setSelectedPlato] = useState(null);

  // Determinar el restaurante activo
  const restauranteActivo = useMemo(() => {
    if (!restaurantes.length) return { nombre: 'Silvestre Vinos & Comidas', direccion: 'Calle del Pez, 14, Madrid', telefono: '+34 912 345 678' };
    return restaurantes.find(r => r.id === selectedRestauranteId) || restaurantes[0];
  }, [restaurantes, selectedRestauranteId]);

  // Filtrar platos del restaurante activo
  const platosRestaurante = useMemo(() => {
    if (!platos || !platos.length) return [];
    return platos.filter(p => !selectedRestauranteId || p.restaurante_id === selectedRestauranteId);
  }, [platos, selectedRestauranteId]);

  // Extraer categorías únicas
  const categorias = useMemo(() => {
    const setCats = new Set(['Todos']);
    platosRestaurante.forEach(p => {
      if (p.categoria) setCats.add(p.categoria);
    });
    return Array.from(setCats);
  }, [platosRestaurante]);

  // Lista de alérgenos habituales para filtro
  const listaAlergenos = [
    'Gluten', 'Lácteos', 'Huevos', 'Pescado', 'Marisco', 'Frutos Secos', 'Soja', 'Mostaza'
  ];

  // Platos filtrados
  const platosFiltrados = useMemo(() => {
    return platosRestaurante.filter(plato => {
      const matchCat = activeCategory === 'Todos' || plato.categoria === activeCategory;
      const matchSearch = plato.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (plato.descripcion && plato.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchAlergeno = true;
      if (filterAlergeno !== 'Todos') {
        const alergenosPlato = Array.isArray(plato.alergenos) ? plato.alergenos : [];
        matchAlergeno = !alergenosPlato.some(a => a.toLowerCase().includes(filterAlergeno.toLowerCase()));
      }

      const { esVegetariano, esVegano } = evaluarDietaPlato(plato);
      let matchDieta = true;
      if (filtroDieta === 'vegetariano') matchDieta = esVegetariano;
      if (filtroDieta === 'vegano') matchDieta = esVegano;

      return matchCat && matchSearch && matchAlergeno && matchDieta;
    });
  }, [platosRestaurante, activeCategory, searchTerm, filterAlergeno, filtroDieta]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0d1117 0%, #161b22 100%)',
      color: '#f0f6fc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 60
    }}>
      {/* Botón flotante para volver al panel si el admin está probando */}
      {onVolverAlPanel && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(13, 17, 23, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '10px 16px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <button 
            onClick={onVolverAlPanel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Volver al Gestor
          </button>
          <div style={{ fontSize: 11, color: '#8b949e', fontWeight: 600 }}>
            VISTA PREVIA CARTA DIGITAL
          </div>
        </div>
      )}

      {/* HEADER RESTAURANTE */}
      <header style={{
        padding: '36px 20px 24px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, rgba(217, 119, 6, 0.15) 0%, transparent 70%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'rgba(217, 119, 6, 0.15)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          color: '#fbbf24',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 12
        }}>
          <Sparkles size={13} /> Carta Gastronómica Digital
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: '-1px',
          margin: 0,
          color: '#fff',
          fontFamily: 'serif'
        }}>
          {restauranteActivo.nombre}
        </h1>
        {restauranteActivo.direccion && (
          <p style={{ fontSize: 13, color: '#8b949e', marginTop: 6, marginBottom: 0 }}>
            📍 {restauranteActivo.direccion}
          </p>
        )}
      </header>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ padding: '20px 16px 10px', maxWidth: 640, margin: '0 auto' }}>
        {/* BUSCADOR */}
        <div style={{
          position: 'relative',
          marginBottom: 16
        }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#8b949e' }} />
          <input
            type="text"
            placeholder="Buscar plato, ingrediente o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px 11px 42px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* CARRUSEL DE CATEGORÍAS */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 8,
          scrollbarWidth: 'none'
        }}>
          {categorias.map(cat => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid #d97706' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#fff' : '#c9d1d9',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FILTRO DE DIETA Y ALÉRGENOS (EXCLUIR) */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            Dieta:
          </span>
          <button
            onClick={() => setFiltroDieta('todos')}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: filtroDieta === 'todos' ? '#d97706' : 'rgba(255,255,255,0.06)', color: filtroDieta === 'todos' ? '#fff' : '#8b949e'
            }}
          >
            Todas
          </button>
          <button
            onClick={() => setFiltroDieta('vegetariano')}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: filtroDieta === 'vegetariano' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
              background: filtroDieta === 'vegetariano' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
              color: filtroDieta === 'vegetariano' ? '#34d399' : '#c9d1d9'
            }}
          >
            🌱 Vegetariano
          </button>
          <button
            onClick={() => setFiltroDieta('vegano')}
            style={{
              padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: filtroDieta === 'vegano' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              background: filtroDieta === 'vegano' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.06)',
              color: filtroDieta === 'vegano' ? '#34d399' : '#c9d1d9'
            }}
          >
            🌿 Vegano
          </button>

          <span style={{ fontSize: 11, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', marginLeft: 8 }}>
            Excluir alérgeno:
          </span>
          <select
            value={filterAlergeno}
            onChange={(e) => setFilterAlergeno(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#d2a8ff',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Todos">Ningún filtro</option>
            {listaAlergenos.map(a => (
              <option key={a} value={a}>Sin {a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTADO DE PLATOS */}
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '10px 16px' }}>
        {platosFiltrados.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            marginTop: 20
          }}>
            <UtensilsCrossed size={36} style={{ color: '#8b949e', opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontSize: 16, fontWeight: 700 }}>No se encontraron platos</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginTop: 4 }}>
              Prueba a cambiar el filtro o el término de búsqueda.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {platosFiltrados.map(plato => {
              const precioRaw = plato.precioVenta !== undefined ? plato.precioVenta : (plato.precio_venta !== undefined ? plato.precio_venta : 0);
              const precioNum = parseFloat(precioRaw) || 0;
              const alergenosArr = Array.isArray(plato.alergenos) ? plato.alergenos : [];
              const { esVegetariano, esVegano } = evaluarDietaPlato(plato);

              return (
                <div
                  key={plato.id}
                  onClick={() => setSelectedPlato(plato)}
                  style={{
                    background: 'rgba(22, 27, 34, 0.8)',
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '16px',
                    display: 'flex',
                    justify: 'space-between',
                    gap: 16,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(217, 119, 6, 0.15)',
                        color: '#fbbf24'
                      }}>
                        {plato.categoria || 'Principal'}
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#8b949e',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        ⏱️ {plato.tiempo_preparacion || plato.tiempoPreparacion || 15} min
                      </span>

                      {esVegano ? (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          🌿 Vegano
                        </span>
                      ) : esVegetariano ? (
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: 'rgba(52, 211, 153, 0.12)', color: '#6ee7b7', border: '1px solid rgba(52, 211, 153, 0.25)'
                        }}>
                          🌱 Vegetariano
                        </span>
                      ) : null}
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '4px 0 6px', color: '#fff' }}>
                      {plato.nombre}
                    </h3>

                    {plato.descripcion && (
                      <p style={{
                        fontSize: 13,
                        color: '#8b949e',
                        margin: 0,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {plato.descripcion}
                      </p>
                    )}

                    {/* BADGES ALÉRGENOS */}
                    {alergenosArr.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {alergenosArr.map((al, idx) => {
                          const conf = getAlergenoConfig(al);
                          return (
                            <span
                              key={idx}
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 8,
                                background: conf.bg,
                                color: conf.color,
                                border: `1px solid ${conf.border}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span>{conf.icon}</span> {al}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 'none' }}>
                    <div style={{
                      fontSize: 19,
                      fontWeight: 900,
                      color: '#fbbf24',
                      letterSpacing: '-0.5px'
                    }}>
                      {precioNum.toFixed(2).replace('.', ',')} €
                    </div>

                    {(plato.imagen_url || plato.imagenUrl) && (
                      <div style={{
                        width: 72,
                        height: 72,
                        borderRadius: 14,
                        overflow: 'hidden',
                        marginTop: 8,
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        flex: 'none'
                      }}>
                        <img 
                          src={plato.imagen_url || plato.imagenUrl} 
                          alt={plato.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER INFORMACIÓN */}
      <footer style={{
        marginTop: 40,
        textAlign: 'center',
        padding: '20px',
        color: '#8b949e',
        fontSize: 12,
        borderTop: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <ShieldCheck size={16} style={{ color: '#3fb950' }} />
          <span>Información de Alérgenos según Reglamento UE 1169/2011</span>
        </div>
        <div>Si padece alguna alergia o intolerancia, consulte con nuestro personal de sala.</div>
        <div style={{ marginTop: 12, opacity: 0.5, fontSize: 10 }}>
          Powered by Restaurantes AIron Labs
        </div>
      </footer>

      {/* MODAL DETALLE DE PLATO */}
      {selectedPlato && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: 20,
          zIndex: 1000
        }} onClick={() => setSelectedPlato(null)}>
          <div style={{
            background: '#161b22',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 24,
            padding: 24,
            maxWidth: 480,
            width: '100%',
            color: '#fff',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            {(selectedPlato.imagen_url || selectedPlato.imagenUrl) && (
              <div style={{
                width: 'calc(100% + 48px)',
                height: 180,
                margin: '-24px -24px 20px -24px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <img 
                  src={selectedPlato.imagen_url || selectedPlato.imagenUrl} 
                  alt={selectedPlato.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                  background: 'linear-gradient(to top, #161b22, transparent)'
                }} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#fbbf24' }}>
                    {selectedPlato.categoria || 'Plato'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#8b949e' }}>
                    ⏱️ Prep: {selectedPlato.tiempo_preparacion || selectedPlato.tiempoPreparacion || 15} min
                  </span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: '4px 0 8px' }}>
                  {selectedPlato.nombre}
                </h2>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>
                {(parseFloat(selectedPlato.precioVenta !== undefined ? selectedPlato.precioVenta : selectedPlato.precio_venta) || 0).toFixed(2).replace('.', ',')} €
              </div>
            </div>

            {selectedPlato.descripcion && (
              <p style={{ fontSize: 14, color: '#c9d1d9', lineHeight: 1.5, marginTop: 12 }}>
                {selectedPlato.descripcion}
              </p>
            )}

            <div style={{ marginTop: 20, padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#8b949e', marginBottom: 8, textTransform: 'uppercase' }}>
                Alérgenos Presentes:
              </div>
              {Array.isArray(selectedPlato.alergenos) && selectedPlato.alergenos.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedPlato.alergenos.map((al, idx) => {
                    const conf = getAlergenoConfig(al);
                    return (
                      <span key={idx} style={{
                        fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                        background: conf.bg, color: conf.color, border: `1px solid ${conf.border}`,
                        display: 'inline-flex', alignItems: 'center', gap: 6
                      }}>
                        <span>{conf.icon}</span> {al}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#3fb950', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} /> Libre de alérgenos principales catalogados
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPlato(null)}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '12px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                border: 'none',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
