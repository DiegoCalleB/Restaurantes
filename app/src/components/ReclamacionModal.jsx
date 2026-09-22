import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, Mail, AlertTriangle } from 'lucide-react';
import { generarReclamacionProveedor } from '../utils/supplierNegotiator';

export function ReclamacionModal({ 
  proveedorNombre = 'Distribuciones Ibérica S.L.', 
  comercialTelefono = '', 
  comercialEmail = '', 
  numeroAlbaran = 'ALB-2026-0842', 
  fechaAlbaran = 'Reciente', 
  restauranteNombre = 'Silvestre Vinos y Comidas', 
  itemsConDiscrepancia = [], 
  importeReclamado = 70.00,
  onClose 
}) {
  const [copiado, setCopiado] = useState(false);

  const datosReclamacion = generarReclamacionProveedor({
    proveedorNombre,
    comercialTelefono,
    comercialEmail,
    numeroAlbaran,
    fechaAlbaran,
    restauranteNombre,
    itemsConDiscrepancia,
    importeReclamado
  });

  const handleCopiarText = () => {
    navigator.clipboard.writeText(datosReclamacion.mensajeWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', width: '100%', maxWidth: 540, borderRadius: 24,
        border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        padding: 24, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {/* CABECERA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)' }}>Agente Negociador de Proveedores</div>
              <div style={{ fontSize: 12, color: 'var(--textSoft)' }}>Reclamar Nota de Abono a {proveedorNombre}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* METADATA RESUMEN */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Nº Documento</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{numeroAlbaran}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Abono Reclamado</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--danger)' }}>+{importeReclamado.toFixed(2)}€</div>
          </div>
        </div>

        {/* PREVISUALIZACIÓN DE TEXTO IA */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 6 }}>
            Mensaje de Reclamación Generado (WhatsApp / Email):
          </label>
          <div style={{
            background: '#0F172A', color: '#E2E8F0', borderRadius: 12, padding: 14,
            fontSize: 12.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {datosReclamacion.mensajeWhatsApp}
          </div>
        </div>

        {/* BOTONES ACCIÓN 1-CLIC */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <a
            href={datosReclamacion.urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12, background: 'var(--whatsapp)',
              color: '#fff', fontSize: 13.5, fontWeight: 800, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)', cursor: 'pointer'
            }}
          >
            <MessageSquare size={18} /> Reclamar por WhatsApp (1-Clic)
          </a>

          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href={datosReclamacion.urlEmail}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10, background: 'var(--surface)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5, fontWeight: 700,
                textDecoration: 'none', cursor: 'pointer'
              }}
            >
              <Mail size={16} style={{ color: 'var(--accent)' }} /> Abrir en Email
            </a>

            <button
              onClick={handleCopiarText}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', borderRadius: 10,
                background: copiado ? 'var(--success)' : 'var(--accent)',
                border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer'
              }}
            >
              {copiado ? <Check size={16} /> : <Copy size={16} />}
              {copiado ? '¡Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
