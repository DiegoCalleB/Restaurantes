import React from 'react';
import { getInitials, getAvatarBg, getStatusMeta } from '../data';
import { Trash2 } from 'lucide-react';

export default function AlbaranesView({ isAdmin, setView, setSelectedId, albaranesFilter = 'Todos', setAlbaranesFilter, albaranesData = [], eliminarAlbaran }) {
  const filteredData = albaranesFilter === 'Todos' 
    ? albaranesData 
    : albaranesFilter === 'Incidencias'
      ? albaranesData.filter(a => a.estado === 'incidencia' || (a.items && a.items.some(i => i.flag)))
      : albaranesData.filter(a => a.estado === albaranesFilter);

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>Proveedor: Todos</div>
        
        <select 
          value={albaranesFilter} 
          onChange={(e) => setAlbaranesFilter(e.target.value)}
          style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer', outline: 'none' }}
        >
          <option value="Todos">Estado: Todos</option>
          <option value="procesado">Estado: Procesados</option>
          <option value="Incidencias">Estado: Con Incidencias</option>
        </select>

        <div style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 16px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>Este mes</div>
      </div>

      {/* VISTA DESKTOP (Tabla con columnas fijas) */}
      <div className="hide-mobile" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1.2fr 0.6fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.03em', padding: '14px 22px', background: 'var(--bg)' }}>
          <div>Nº albarán</div><div>Proveedor</div><div>Tipo</div><div>Fecha</div><div>Importe</div><div>Estado</div><div></div>
        </div>
        
        {filteredData.map(a => {
          const m = getStatusMeta(a.estado);
          return (
            <div 
              key={a.id}
              onClick={() => { setSelectedId(a.id); setView('detalle'); }}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 1.2fr 0.6fr', alignItems: 'center', padding: '14px 22px', borderTop: '1px solid var(--bg)', cursor: 'pointer', fontSize: 13.5 }}
            >
              <div style={{ fontWeight: 700 }}>{a.numero}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: getAvatarBg(a.proveedor), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 800 }}>{getInitials(a.proveedor)}</div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{a.proveedor}</div>
              </div>
              <div style={{ color: 'var(--textSoft)', fontWeight: 600, fontSize: 12 }}>{a.tipo}</div>
              <div style={{ color: 'var(--textSoft)', fontWeight: 500 }}>{a.fecha}</div>
              <div style={{ fontWeight: 600 }}>€{a.importe}</div>
              <div><span style={{ color: m.color, background: m.bg, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{m.label}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 12.5 }}>Ver →</div>
                <div 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (eliminarAlbaran && window.confirm("¿Seguro que quieres eliminar este albarán?")) {
                      await eliminarAlbaran(a.id);
                    }
                  }}
                  style={{ color: 'var(--danger)', padding: 4, display: 'flex' }}
                  title="Eliminar albarán"
                >
                  <Trash2 size={14} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VISTA MÓVIL (Tarjetas de toque fácil) */}
      <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredData.map(a => {
          const m = getStatusMeta(a.estado);
          return (
            <div 
              key={a.id}
              onClick={() => { setSelectedId(a.id); setView('detalle'); }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 16,
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: getAvatarBg(a.proveedor), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                    {getInitials(a.proveedor)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>{a.proveedor}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>Nº {a.numero} • {a.fecha}</div>
                  </div>
                </div>
                <span style={{ color: m.color, background: m.bg, padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                  {m.label}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 600, textTransform: 'uppercase' }}>Importe: </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>€{a.importe}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (eliminarAlbaran && window.confirm("¿Seguro que quieres eliminar este albarán?")) {
                        await eliminarAlbaran(a.id);
                      }
                    }}
                    style={{ color: 'var(--danger)', padding: 8, borderRadius: 8, background: 'var(--dangerSoft)', display: 'flex', alignItems: 'center' }}
                    title="Eliminar albarán"
                  >
                    <Trash2 size={16} />
                  </div>
                  <button className="btn btn-sm btn-primary" style={{ padding: '6px 14px' }}>
                    Ver albarán →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
