import React from 'react';
import { ArrowLeft, Edit3, Save, CheckCircle2, AlertTriangle, FileText, DownloadCloud, Trash2 } from 'lucide-react';
import { getStatusMeta } from '../data';

export default function DetalleView({ selectedId, setView, albaranesData = [], eliminarAlbaran }) {
  const selected = albaranesData.find(a => a.id === selectedId) || albaranesData[0];
  const flaggedCount = selected.items.filter(i => i.flag).length;
  const selStatusMeta = getStatusMeta(selected.estado);

  const headerFields = [
    { label: 'Proveedor', value: selected.proveedor, badgeColor: 'var(--success)', badgeBg: 'var(--successSoft)', badgeLabel: 'Extracción IA' },
    { label: 'Nº albarán', value: selected.numero, badgeColor: 'var(--success)', badgeBg: 'var(--successSoft)', badgeLabel: 'Extracción IA' },
    { label: 'Fecha', value: selected.fecha, badgeColor: 'var(--success)', badgeBg: 'var(--successSoft)', badgeLabel: 'Extracción IA' },
    { label: 'Importe total', value: '€' + selected.importe, badgeColor: 'var(--success)', badgeBg: 'var(--successSoft)', badgeLabel: 'Extracción IA' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div 
          onClick={() => setView('albaranes')}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <ArrowLeft size={16} /> Volver a Albaranes
        </div>
        <button 
          onClick={async () => {
            if (window.confirm("¿Seguro que quieres eliminar este albarán? Se borrarán también todas sus líneas de detalle.")) {
              const exito = await eliminarAlbaran(selected.id);
              if (exito) setView('albaranes');
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)',
            padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Trash2 size={14} /> Eliminar albarán
        </button>
      </div>

      {flaggedCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--dangerSoft)', border: '1px solid rgba(142, 38, 38, 0.2)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--danger)', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <AlertTriangle size={16} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--danger)', flex: 1 }}>
              Se han detectado {flaggedCount} incidencias en este albarán frente a la tarifa o pedido registrado.
            </div>
            <button
              onClick={() => {
                const lineasConIncidencia = selected.items.filter(i => i.flag).map(i => `- ${i.producto}: ${i.motivo}`).join('\n');
                const textoReclamacion = `Hola team de ${selected.proveedor},\n\nOs escribo en relación al albarán nº ${selected.numero} de fecha ${selected.fecha}.\n\nHemos detectado las siguientes incidencias en los precios/cantidades:\n${lineasConIncidencia}\n\nPor favor, confirmadnos si nos emitís nota de abono o rectificativa.\n\nUn saludo!`;
                
                const urlWa = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoReclamacion)}`;
                window.open(urlWa, '_blank');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#25D366', color: '#fff', border: 'none',
                padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
            >
              📱 Reclamar por WhatsApp
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20, alignItems: 'start' }}>
        {/* Document Scanner Preview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, position: 'sticky', top: 16, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          {selected.imagenUrl ? (
            <img src={selected.imagenUrl} alt="Albarán" style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
          ) : (
            <div style={{ aspectRatio: '3/4', borderRadius: 12, background: 'repeating-linear-gradient(135deg, var(--bg), var(--bg) 10px, var(--border) 10px, var(--border) 20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: 'var(--textSoft)', background: 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                documento escaneado<br/>[previsualización del albarán]
              </span>
            </div>
          )}
        </div>

        {/* Extracted Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>Datos extraídos</div>
              <span style={{ color: selStatusMeta.color, background: selStatusMeta.bg, padding: '6px 13px', borderRadius: 20, fontSize: 12.5, fontWeight: 700 }}>
                {selStatusMeta.label}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {headerFields.map((f, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, marginBottom: 5 }}>{f.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 7 }}>{f.value}</div>
                  <span style={{ color: f.badgeColor, background: f.badgeBg, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 12 }}>
                    {f.badgeLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>Líneas de producto</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.9fr 0.9fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 4px 8px' }}>
              <div>Producto</div><div>Cant.</div><div>Precio ud.</div><div>Total</div>
            </div>
            
            {selected.items.map((it, i) => (
              <div key={i} style={{ borderRadius: 10, background: it.flag ? 'var(--dangerSoft)' : 'transparent', marginBottom: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.7fr 0.9fr 0.9fr', padding: '11px 8px', fontSize: 13.5, alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{it.producto}</div>
                  <div>{it.cantidad || '-'}</div>
                  <div>{it.precioUnit ? `€${it.precioUnit}` : '-'}</div>
                  <div style={{ fontWeight: 700 }}>{it.total ? `€${it.total}` : '-'}</div>
                </div>
                {it.flag && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', padding: '0 8px 12px', fontWeight: 700 }}>
                    ⚠ {it.motivo}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>Resumen de totales</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg)', fontSize: 13.5 }}>
              <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>Base Imponible</div>
              <div style={{ fontWeight: 700 }}>€{selected.baseImponible}</div>
            </div>

            {selected.desgloseIva && selected.desgloseIva.length > 0 && selected.desgloseIva.map((iva, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg)', fontSize: 13.5 }}>
                <div style={{ color: 'var(--textSoft)', fontWeight: 600 }}>IVA {iva.porcentaje}% (Base: €{iva.base})</div>
                <div style={{ fontWeight: 700 }}>€{iva.cuota}</div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: 16 }}>
              <div style={{ fontWeight: 800 }}>Total Factura</div>
              <div style={{ fontWeight: 800, color: 'var(--accent)' }}>€{selected.importe}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', color: 'white', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 6px 16px -4px rgba(59, 110, 165, 0.4)' }}>
              Confirmar validación
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: 14, borderRadius: 12, border: '1px solid var(--border)', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', background: 'var(--surface)' }}>
              Editar manualmente
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
