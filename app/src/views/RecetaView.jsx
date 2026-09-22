import React, { useState } from 'react';
import { ArrowLeft, Scale, Calculator, AlertTriangle, Trash2, Camera, Loader2, Image as ImageIcon, Edit, Clock } from 'lucide-react';
import EditarEscandalloModal from './EditarEscandalloModal';

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

export default function RecetaView({ selectedPlatoId, setView, setSelectedId, platos = [], eliminarPlato, actualizarImagenPlato, actualizarCategoriaPlato, ingredientesBase = [], actualizarEscandalloCompleto }) {
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const p = platos.find(x => x.id === selectedPlatoId);
  
  if (!p) return null;

  const esMargenPeligroso = p.margenPct < 65;
  const recomendacionPVP = p.coste / 0.35; // Sugerir un precio para tener ~65% de margen

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      if (actualizarImagenPlato) {
        await actualizarImagenPlato(p.id, file);
      }
    } catch (err) {
      console.error("Error al subir imagen:", err);
    } finally {
      setUploading(false);
    }
  };

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

      {/* CABECERA CON NOMBRE Y BOTONES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--textSoft)' }}>Categoría:</span>
            <select
              value={p.categoria || 'Otros'}
              onChange={async (e) => {
                const nuevaCat = e.target.value;
                if (actualizarCategoriaPlato) {
                  await actualizarCategoriaPlato(p.id, nuevaCat);
                }
              }}
              style={{
                fontSize: 12, fontWeight: 800,
                background: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.3)',
                color: '#d97706',
                borderRadius: 8,
                padding: '3px 8px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {LISTA_CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <span style={{
              fontSize: 12, fontWeight: 800,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--textSoft)',
              borderRadius: 8,
              padding: '3px 8px',
              display: 'inline-flex', alignItems: 'center', gap: 4
            }}>
              <Clock size={13} /> {p.tiempo_preparacion || p.tiempoPreparacion || 15} min prep.
            </span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: '2px 0 6px' }}>{p.nombre}</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 14, margin: 0 }}>Análisis de rentabilidad basado en los precios medios de compra.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsEditModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 800,
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)'
            }}
          >
            <Edit size={16} /> Editar Receta & PVP (IA)
          </button>

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
      </div>

      {/* ALERTA RENTABILIDAD */}
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

      <div className="split-2col" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Receta e Ingredientes */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>
            <Scale size={18} color="var(--accent)" />
            Ingredientes de la Receta
          </div>
          
          <div className="scroll-x">
          <div style={{ minWidth: 480 }}>
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
          </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 8px 4px', fontSize: 15, fontWeight: 900 }}>
            <div>Coste Total del Plato</div>
            <div>€{p.coste.toFixed(2)}</div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FOTO DEL PLATO Y RESUMEN FINANCIERO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* TARJETA DE GESTIÓN DE LA FOTO DEL PLATO */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ImageIcon size={16} style={{ color: 'var(--accent)' }} /> Imagen para Carta Digital & Redes
            </div>

            <div style={{
              width: '100%', height: 180, borderRadius: 14, overflow: 'hidden',
              background: '#000', border: '1px solid var(--border)', marginBottom: 14,
              position: 'relative'
            }}>
              <img 
                src={p.imagen_url || p.imagenUrl} 
                alt={p.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>

            {/* BOTÓN EXPLÍCITO DE SUBIDA DE IMAGEN */}
            <label style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px', borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)'
            }}>
              {uploading ? (
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Camera size={16} />
              )}
              <span>{uploading ? 'Subiendo a Supabase...' : '📷 Subir / Cambiar Foto del Plato'}</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Panel Financiero */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>
              <Calculator size={18} color="var(--accent)" />
              Resumen Financiero
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--bg)', fontSize: 14 }}>
              <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Precio en Carta (PVP)</div>
              <div style={{ fontWeight: 800 }}>€{(p.precioVenta || p.precio_venta || 0).toFixed(2)}</div>
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
        
      {/* MODAL DE EDICIÓN DE RECETA CON IA */}
      <EditarEscandalloModal 
        plato={p} 
        ingredientesBase={ingredientesBase} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onGuardar={actualizarEscandalloCompleto} 
      />
    </div>
  );
}
