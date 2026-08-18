import React, { useState } from 'react';
import { Package, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function PedidosView({ pedidos = [], proveedoresData = [] }) {
  // En un entorno real, esto conectaría con Supabase para hacer inserts
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 5 }}>Control de Pedidos</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>Cruza lo que has pedido con lo que realmente te facturan.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        >
          <Plus size={16} /> {showForm ? 'Cerrar Formulario' : 'Nuevo Pedido'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surfaceDark)', padding: 20, borderRadius: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Registrar Pedido (Mockup)</h3>
          <p style={{ color: 'var(--textSoft)', fontSize: 13, marginBottom: 16 }}>Aquí el restaurante selecciona el proveedor y añade las líneas de producto pactadas por teléfono o mail.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <select style={{ flex: 1, padding: 10, borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <option>Seleccionar Proveedor...</option>
              {proveedoresData.map(p => <option key={p.id}>{p.nombre}</option>)}
            </select>
            <button style={{ background: 'var(--success)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Guardar Pedido</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {pedidos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--textSoft)' }}>
            <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p>No hay pedidos registrados.</p>
          </div>
        ) : (
          pedidos.map(p => (
            <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--textSoft)' }}>
                  <Package size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.proveedor}</div>
                  <div style={{ color: 'var(--textSoft)', fontSize: 13, marginTop: 4 }}>
                    Pedido el {p.fecha} • {p.lineas_count} artículos
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {p.estado === 'pendiente' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: 13, fontWeight: 700, background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                    <Clock size={14} /> En camino
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: 13, fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 20 }}>
                    <CheckCircle size={14} /> Recibido
                  </span>
                )}
                <button style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, color: 'var(--text)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Ver Detalle</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
