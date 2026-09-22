import React, { useState, useEffect } from 'react';
import { getInitials, getAvatarBg } from '../data';
import { 
  Megaphone, Tv, Radio, Newspaper, Send, Sparkles, Mic, Mail, Search, 
  X, Bot, Loader2, Plus, Edit3, Trash2, CheckCircle2, AlertCircle, ExternalLink
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generarPitchConIA } from '../geminiService';

export default function PromocionView({ restaurantes = [], selectedRestauranteId }) {
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const getNombreRestauranteActivo = () => {
    if (!selectedRestauranteId || selectedRestauranteId === 'all') return 'Silvestre Tirso de Molina';
    const rest = restaurantes.find(r => r.id === selectedRestauranteId);
    if (!rest || !rest.nombre) return 'Silvestre Tirso de Molina';
    const n = rest.nombre.toLowerCase();
    if (n.includes('tirso')) return 'Silvestre (Tirso de Molina)';
    if (n.includes('becerril')) return 'Silvestre (Becerril de la Sierra)';
    return `Silvestre (${rest.nombre})`;
  };

  // Modal de Ficha (Creación / Edición)
  const [showFichaModal, setShowFichaModal] = useState(false);
  const [editingMedio, setEditingMedio] = useState(null); // null = nuevo medio, u objeto = editar
  const [fichaForm, setFichaForm] = useState({
    nombre: '',
    tipo: 'Prensa',
    contacto: '',
    alcance: '',
    enfoque_editorial: '',
    estado: 'Nuevo'
  });
  const [savingFicha, setSavingFicha] = useState(false);

  // Modal de Pitch / Envío de Email
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedMedio, setSelectedMedio] = useState(null);
  const [pitchText, setPitchText] = useState('');
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Modal de Confirmación de Borrado
  const [deletingMedio, setDeletingMedio] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Notificación / Feedback Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    cargarMedios();

    // 1. Listener de eventos personalizados locales
    const handleCustomUpdate = () => {
      cargarMedios();
    };
    window.addEventListener('rrpp_medios_updated', handleCustomUpdate);

    // 2. Suscripción en tiempo real con Supabase Realtime
    let channel = null;
    if (supabase) {
      channel = supabase
        .channel('rrpp_medios_realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rrpp_medios' },
          () => {
            cargarMedios();
          }
        )
        .subscribe();
    }

    return () => {
      window.removeEventListener('rrpp_medios_updated', handleCustomUpdate);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const showNotification = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarMedios = async () => {
    setLoading(true);
    if (!supabase) {
      console.warn("Supabase no configurado.");
      setMedios([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('rrpp_medios')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error("Error cargando medios:", error);
      showNotification("Error al cargar lista de medios", "danger");
    } else {
      setMedios(data || []);
    }
    setLoading(false);
  };

  const getTipoIcon = (tipo) => {
    switch(tipo) {
      case 'TV': return <Tv size={16} />;
      case 'Radio': return <Radio size={16} />;
      case 'Podcast': return <Mic size={16} />;
      case 'Prensa': return <Newspaper size={16} />;
      case 'Redes': return <Megaphone size={16} />;
      default: return <Megaphone size={16} />;
    }
  };

  const getStatusStyle = (estado) => {
    switch(estado) {
      case 'Pendiente_Aprobacion': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', label: 'Pend. Aprobación' };
      case 'Aprobado': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', label: 'Pitch Aprobado' };
      case 'Enviado': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)', label: 'Email Enviado' };
      case 'Esperando_Respuesta': return { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', label: 'Esperando Respuesta' };
      case 'Interesado': return { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', label: 'Interesado' };
      case 'Aceptado': return { color: '#059669', bg: 'rgba(5, 150, 105, 0.2)', label: 'Aparición Aceptada' };
      case 'Rechazado': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'Rechazado' };
      default: return { color: 'var(--textSoft)', bg: 'var(--bg)', label: 'Nuevo' };
    }
  };

  const filteredMedios = medios.filter(m => {
    if (filtro !== 'Todos' && m.tipo !== filtro) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNombre = m.nombre && m.nombre.toLowerCase().includes(q);
      const matchContacto = m.contacto && m.contacto.toLowerCase().includes(q);
      const matchEnfoque = m.enfoque_editorial && m.enfoque_editorial.toLowerCase().includes(q);
      if (!matchNombre && !matchContacto && !matchEnfoque) return false;
    }
    return true;
  });

  // --- GESTIÓN DE FICHA (CREAR / EDITAR) ---
  const handleOpenNuevaFicha = () => {
    setEditingMedio(null);
    setFichaForm({
      nombre: '',
      tipo: 'Prensa',
      contacto: '',
      alcance: '',
      enfoque_editorial: '',
      estado: 'Nuevo'
    });
    setShowFichaModal(true);
  };

  const handleOpenEditarFicha = (medio) => {
    setEditingMedio(medio);
    setFichaForm({
      nombre: medio.nombre || '',
      tipo: medio.tipo || 'Prensa',
      contacto: medio.contacto || '',
      alcance: medio.alcance || '',
      enfoque_editorial: medio.enfoque_editorial || '',
      estado: medio.estado || 'Nuevo'
    });
    setShowFichaModal(true);
  };

  const handleGuardarFicha = async (e) => {
    e.preventDefault();
    if (!fichaForm.nombre.trim()) {
      alert("Por favor, introduce el nombre del medio o periodista.");
      return;
    }

    setSavingFicha(true);
    try {
      if (!supabase) throw new Error("Cliente de Supabase no disponible");

      const payload = {
        nombre: fichaForm.nombre.trim(),
        tipo: fichaForm.tipo,
        contacto: fichaForm.contacto.trim(),
        alcance: fichaForm.alcance.trim(),
        enfoque_editorial: fichaForm.enfoque_editorial.trim(),
        estado: fichaForm.estado
      };

      if (editingMedio) {
        // Actualizar ficha existente
        const { error } = await supabase
          .from('rrpp_medios')
          .update(payload)
          .eq('id', editingMedio.id);

        if (error) throw error;
        showNotification(`Ficha de "${payload.nombre}" actualizada correctamente`, 'success');
      } else {
        // Crear nueva ficha de medio
        const { error } = await supabase
          .from('rrpp_medios')
          .insert([payload]);

        if (error) throw error;
        showNotification(`Medio "${payload.nombre}" añadido al radar`, 'success');
      }

      setShowFichaModal(false);
      await cargarMedios();
    } catch (err) {
      console.error("Error guardando ficha:", err);
      showNotification("Error guardando ficha: " + err.message, "danger");
    } finally {
      setSavingFicha(false);
    }
  };

  // --- BORRADO SEGURO DE MEDIO ---
  const handleConfirmarBorrado = async () => {
    if (!deletingMedio || !supabase) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('rrpp_medios')
        .delete()
        .eq('id', deletingMedio.id);

      if (error) throw error;

      setMedios(medios.filter(m => m.id !== deletingMedio.id));
      showNotification(`Medio "${deletingMedio.nombre}" eliminado`, 'info');
      setDeletingMedio(null);
    } catch (err) {
      console.error("Error al eliminar medio:", err);
      showNotification("No se pudo eliminar el medio: " + err.message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  // --- GESTIÓN DE PITCH Y ENVÍO DE EMAIL ---
  const handleOpenPitchModal = (medio) => {
    setSelectedMedio(medio);
    setPitchText(medio.pitch_generado || '');
    setShowPitchModal(true);
  };

  const handleGenerarPitchIA = async () => {
    if (!selectedMedio) return;
    setGeneratingPitch(true);
    try {
      const pitchGenerado = await generarPitchConIA(selectedMedio, getNombreRestauranteActivo());
      setPitchText(pitchGenerado);
      showNotification("Pitch redactado con IA exitosamente", "success");
    } catch (err) {
      console.error("Error al generar pitch:", err);
      showNotification("Error generando pitch con IA", "danger");
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleEnviarEmailApp = async () => {
    if (!selectedMedio || !pitchText.trim()) return;
    if (!selectedMedio.contacto) {
      alert("Este medio no tiene un correo de contacto guardado en su ficha.");
      return;
    }

    setSendingEmail(true);
    try {
      if (!supabase) throw new Error("Base de datos no disponible");

      // Actualizar estado en Supabase a 'Enviado' y guardar el pitch definitivo
      const { error } = await supabase
        .from('rrpp_medios')
        .update({
          estado: 'Enviado',
          pitch_generado: pitchText
        })
        .eq('id', selectedMedio.id);

      if (error) throw error;

      // Actualizar estado local
      setMedios(medios.map(m => m.id === selectedMedio.id ? { ...m, estado: 'Enviado', pitch_generado: pitchText } : m));
      showNotification(`Email enviado a ${selectedMedio.nombre} (${selectedMedio.contacto})`, 'success');
      setShowPitchModal(false);
    } catch (err) {
      console.error("Error al enviar email:", err);
      showNotification("Error registrando envío de email: " + err.message, 'danger');
    } finally {
      setSendingEmail(false);
    }
  };

  // Extraer asunto y cuerpo del pitch para la URL mailto:
  const getMailtoLink = () => {
    if (!selectedMedio || !selectedMedio.contacto) return '#';
    let asunto = `Contacto RRPP - Propuesta para ${selectedMedio.nombre}`;
    let cuerpo = pitchText;

    const lineas = pitchText.split('\n');
    if (lineas.length > 0 && lineas[0].toLowerCase().startsWith('asunto:')) {
      asunto = lineas[0].replace(/asunto:/i, '').trim();
      cuerpo = lineas.slice(1).join('\n').trim();
    }

    return `mailto:${selectedMedio.contacto}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', color: 'var(--textSoft)', gap: 10 }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <div>Cargando contactos RRPP...</div>
      </div>
    );
  }

  return (
    <div>
      {/* NOTIFICACIÓN TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
          background: toast.type === 'danger' ? '#ef4444' : toast.type === 'success' ? '#10b981' : 'var(--accent)',
          color: '#fff', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeIn 0.3s'
        }}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER METRICS */}
      <div className="grid-4" style={{ gap: 14, marginBottom: 22 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Medios en Radar</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>{medios.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Pitches Enviados</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>
            {medios.filter(m => ['Enviado', 'Esperando_Respuesta', 'Interesado', 'Aceptado'].includes(m.estado)).length}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Apariciones Aceptadas</div>
          <div style={{ fontSize: 27, fontWeight: 800, color: 'var(--success)', marginTop: 8 }}>
            {medios.filter(m => m.estado === 'Aceptado').length}
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accentDeep, #2563eb))', color: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles size={16} /> Radar Inteligente</span>
            <button 
              onClick={handleOpenNuevaFicha}
              style={{
                background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none',
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Plus size={14} /> Crear Medio
            </button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.95, marginTop: 8 }}>
            Gestiona tus contactos de prensa, edita fichas, genera pitches con Gemini y envía emails directamente.
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Todos', 'Prensa', 'Radio', 'TV', 'Podcast', 'Redes'].map(t => (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              style={{
                background: filtro === t ? 'var(--text)' : 'var(--surface)',
                color: filtro === t ? 'var(--surface)' : 'var(--textSoft)',
                border: '1px solid',
                borderColor: filtro === t ? 'var(--text)' : 'var(--border)',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 250 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--textSoft)' }} />
            <input 
              type="text" 
              placeholder="Buscar medio, email o editorial..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px 8px 34px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text)', outline: 'none', fontSize: 13, fontWeight: 600
              }}
            />
          </div>

          <button
            onClick={handleOpenNuevaFicha}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Añadir Medio
          </button>
        </div>
      </div>

      {/* TABLA DE MEDIOS */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.8fr 0.9fr 1.1fr 1.2fr 1.5fr', 
          fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', 
          textTransform: 'uppercase', padding: '0 8px 12px', borderBottom: '1px solid var(--border)' 
        }}>
          <div>Medio / Contacto</div>
          <div>Tipo</div>
          <div>Alcance</div>
          <div>Estado</div>
          <div style={{ textAlign: 'right' }}>Acciones</div>
        </div>

        {filteredMedios.map(m => {
          const s = getStatusStyle(m.estado);
          return (
            <div key={m.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '1.8fr 0.9fr 1.1fr 1.2fr 1.5fr', 
              alignItems: 'center', padding: '14px 8px', 
              borderTop: '1px solid var(--border)', fontSize: 13.5 
            }}>
              {/* Columna Medio */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 }}>
                <div style={{ 
                  width: 36, height: 36, borderRadius: 10, 
                  background: getAvatarBg(m.nombre), color: '#fff', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 13, flexShrink: 0 
                }}>
                  {getInitials(m.nombre)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nombre}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.contacto ? m.contacto : <span style={{ fontStyle: 'italic', opacity: 0.7 }}>Sin email de contacto</span>}
                  </div>
                </div>
              </div>

              {/* Columna Tipo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--textSoft)', fontWeight: 600 }}>
                {getTipoIcon(m.tipo)} <span>{m.tipo || 'Prensa'}</span>
              </div>

              {/* Columna Alcance */}
              <div style={{ fontWeight: 600, color: 'var(--textSoft)', fontSize: 12.5 }}>
                {m.alcance || 'No especificado'}
              </div>

              {/* Columna Estado */}
              <div>
                <span style={{ 
                  color: s.color, background: s.bg, 
                  padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                  display: 'inline-block'
                }}>
                  {s.label}
                </span>
              </div>

              {/* Columna Acciones */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                {/* Botón Redactar / Enviar Email */}
                <button
                  onClick={() => handleOpenPitchModal(m)}
                  title="Redactar / Enviar Pitch"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: m.estado === 'Enviado' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg)',
                    border: `1px solid ${m.estado === 'Enviado' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
                    color: m.estado === 'Enviado' ? '#10b981' : 'var(--text)',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Mail size={14} /> {m.estado === 'Enviado' ? 'Revisar Email' : 'Enviar Email'}
                </button>

                {/* Botón Editar Ficha */}
                <button
                  onClick={() => handleOpenEditarFicha(m)}
                  title="Editar Ficha de Medio"
                  style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    color: 'var(--text)', padding: '6px 10px', borderRadius: 8,
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <Edit3 size={14} />
                </button>

                {/* Botón Eliminar Medio */}
                <button
                  onClick={() => setDeletingMedio(m)}
                  title="Eliminar Medio"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444', padding: '6px 10px', borderRadius: 8,
                    cursor: 'pointer', display: 'flex', alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredMedios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--textSoft)', fontSize: 14 }}>
            No se han encontrado medios que coincidan con la búsqueda o filtro seleccionado.
          </div>
        )}
        </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: FICHA DE MEDIO (CREACIÓN / EDICIÓN) */}
      {/* ================================================================= */}
      {showFichaModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 540, borderRadius: 20,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={18} style={{ color: 'var(--accent)' }} />
                {editingMedio ? `Editar Ficha: ${editingMedio.nombre}` : 'Nuevo Medio de Comunicación'}
              </div>
              <button onClick={() => setShowFichaModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--textSoft)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarFicha} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Nombre del Medio o Periodista *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: GastroMadrid, El Mundo Metrópoli, Cadena SER..."
                  value={fichaForm.nombre}
                  onChange={(e) => setFichaForm({ ...fichaForm, nombre: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Tipo de Medio</label>
                  <select
                    value={fichaForm.tipo}
                    onChange={(e) => setFichaForm({ ...fichaForm, tipo: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none'
                    }}
                  >
                    <option value="Prensa">Prensa / Revista</option>
                    <option value="Radio">Radio</option>
                    <option value="TV">Televisión</option>
                    <option value="Podcast">Podcast</option>
                    <option value="Redes">Redes / Influencers</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Correo Electrónico (Contacto)</label>
                  <input 
                    type="email" 
                    placeholder="redaccion@medio.com"
                    value={fichaForm.contacto}
                    onChange={(e) => setFichaForm({ ...fichaForm, contacto: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Alcance Estimado</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 50k lectores/mes, 120k oyentes..."
                    value={fichaForm.alcance}
                    onChange={(e) => setFichaForm({ ...fichaForm, alcance: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Estado</label>
                  <select
                    value={fichaForm.estado}
                    onChange={(e) => setFichaForm({ ...fichaForm, estado: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid var(--border)', background: 'var(--bg)',
                      color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none'
                    }}
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Pendiente_Aprobacion">Pendiente de Aprobación</option>
                    <option value="Aprobado">Pitch Aprobado</option>
                    <option value="Enviado">Email Enviado</option>
                    <option value="Esperando_Respuesta">Esperando Respuesta</option>
                    <option value="Interesado">Interesado</option>
                    <option value="Aceptado">Aparición Aceptada</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Enfoque Editorial / Notas</label>
                <textarea
                  rows={3}
                  placeholder="Línea editorial del medio, temáticas principales, periodista de contacto..."
                  value={fichaForm.enfoque_editorial}
                  onChange={(e) => setFichaForm({ ...fichaForm, enfoque_editorial: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowFichaModal(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFicha}
                  style={{
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    padding: '10px 22px', borderRadius: 10, fontWeight: 700, cursor: savingFicha ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  {savingFicha ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
                  {editingMedio ? 'Guardar Cambios' : 'Añadir Medio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: REDACTAR Y ENVIAR EMAIL DE PITCH */}
      {/* ================================================================= */}
      {showPitchModal && selectedMedio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 650, borderRadius: 20,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: getAvatarBg(selectedMedio.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {getInitials(selectedMedio.nombre)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Pitch / Email a {selectedMedio.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--textSoft)', fontWeight: 600 }}>
                    Destinatario: {selectedMedio.contacto ? selectedMedio.contacto : <span style={{ color: '#ef4444' }}>⚠️ Sin email guardado</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowPitchModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--textSoft)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--textSoft)' }}>
                  Redacción del Mensaje:
                </span>
                
                {/* Botón Autocompletar con Gemini IA */}
                <button 
                  type="button"
                  onClick={handleGenerarPitchIA}
                  disabled={generatingPitch}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7',
                    border: '1px solid rgba(168, 85, 247, 0.25)', padding: '6px 14px',
                    borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: generatingPitch ? 'not-allowed' : 'pointer'
                  }}
                >
                  {generatingPitch ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />} 
                  {generatingPitch ? 'Redactando con Gemini...' : 'Redactar con Gemini IA'}
                </button>
              </div>

              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Escribe el mensaje o pulsa 'Redactar con Gemini IA' para generar una propuesta personalizada..."
                style={{
                  width: '100%', height: 230, padding: 16, borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: 13.5, fontFamily: 'inherit', resize: 'none', outline: 'none',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {/* BOTONES DE ACCIÓN DEL EMAIL */}
            <div style={{ padding: '16px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <a
                  href={getMailtoLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: 'var(--textSoft)', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', padding: '6px 10px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)'
                  }}
                >
                  <ExternalLink size={14} /> Abrir en App de Correo Local (Mailto)
                </a>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setShowPitchModal(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cerrar
                </button>

                <button 
                  onClick={handleEnviarEmailApp}
                  disabled={sendingEmail || !pitchText.trim() || !selectedMedio.contacto}
                  style={{ 
                    background: pitchText.trim() && selectedMedio.contacto ? 'var(--accent)' : 'var(--border)', 
                    color: pitchText.trim() && selectedMedio.contacto ? '#fff' : 'var(--textSoft)', 
                    border: 'none', padding: '8px 20px', borderRadius: 8, 
                    fontWeight: 700, cursor: pitchText.trim() && selectedMedio.contacto ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  {sendingEmail ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                  {sendingEmail ? 'Enviando...' : 'Enviar Email Ahora'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: CONFIRMACIÓN DE BORRADO */}
      {/* ================================================================= */}
      {deletingMedio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 440, borderRadius: 20,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            padding: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#ef4444', marginBottom: 14 }}>
              <AlertCircle size={28} />
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>¿Eliminar Medio?</div>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--textSoft)', lineHeight: '1.5', marginBottom: 20 }}>
              ¿Estás seguro de que deseas eliminar la ficha de <strong style={{ color: 'var(--text)' }}>{deletingMedio.nombre}</strong>? 
              Esta acción eliminará permanentemente el contacto y su historial de la base de datos de Supabase.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setDeletingMedio(null)}
                disabled={deleting}
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarBorrado}
                disabled={deleting}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none',
                  padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {deleting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={16} />}
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
