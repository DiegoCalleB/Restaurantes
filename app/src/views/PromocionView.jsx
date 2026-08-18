import React, { useState, useEffect } from 'react';
import { getInitials, getAvatarBg } from '../data';
import { Megaphone, Tv, Radio, Newspaper, Send, Sparkles, Mic, Mail, Search, X, Bot, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function PromocionView() {
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal de Pitch IA
  const [showModal, setShowModal] = useState(false);
  const [selectedMedio, setSelectedMedio] = useState(null);
  const [pitchText, setPitchText] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    cargarMedios();
  }, []);

  const cargarMedios = async () => {
    setLoading(true);
    if (!supabase) {
      console.warn("Supabase no configurado, usando datos vacíos.");
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
      default: return <Megaphone size={16} />;
    }
  };

  const getStatusStyle = (estado) => {
    switch(estado) {
      case 'Pendiente_Aprobacion': return { color: 'var(--warning)', bg: 'rgba(242, 201, 76, 0.1)' };
      case 'Aprobado': return { color: 'var(--accent)', bg: 'var(--bg)' };
      case 'Enviado': return { color: '#fff', bg: 'var(--accent)' };
      case 'Esperando_Respuesta': return { color: 'var(--text)', bg: 'var(--border)' };
      case 'Interesado': return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' };
      case 'Aceptado': return { color: 'var(--success)', bg: 'rgba(39, 174, 96, 0.1)' };
      case 'Rechazado': return { color: 'var(--danger)', bg: 'rgba(235, 87, 87, 0.1)' };
      default: return { color: 'var(--textSoft)', bg: 'var(--bg)' };
    }
  };

  const filteredMedios = medios.filter(m => {
    if (filtro !== 'Todos' && m.tipo !== filtro) return false;
    if (searchTerm && !m.nombre.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleOpenPitch = (medio) => {
    setSelectedMedio(medio);
    setPitchText(medio.pitch_generado || '');
    setShowModal(true);
  };

  const generateAIPitch = () => {
    setGenerating(true);
    // Simulación de IA (en el futuro esto lo rellenará el redactor.py, 
    // pero dejamos este botón para forzar/sobreescribir si queremos usar Gemini en frontend)
    setTimeout(() => {
      setPitchText(`Hola equipo de ${selectedMedio.nombre},\n\nOs escribo desde [Nombre Restaurante]. Hemos renovado recientemente nuestra carta incorporando ingredientes 100% locales y de kilómetro cero, lo cual está teniendo una acogida fantástica en el barrio.\n\nDado vuestro enfoque en ${selectedMedio.tipo === 'TV' || selectedMedio.tipo === 'Radio' ? 'programación de actualidad' : 'tendencias gastronómicas'}, creemos que a vuestra audiencia le encantaría conocer nuestra historia y probar nuestro nuevo plato estrella.\n\n¿Estaríais interesados en que os enviemos una pequeña degustación o en realizar una breve entrevista?\n\nUn saludo,\nEl equipo de [Nombre Restaurante]`);
      setGenerating(false);
    }, 1500);
  };

  const handleApprovePitch = async () => {
    if (!supabase) return;
    
    // Actualizar en base de datos a estado "Aprobado"
    const { error } = await supabase
      .from('rrpp_medios')
      .update({ estado: 'Aprobado', pitch_generado: pitchText })
      .eq('id', selectedMedio.id);
      
    if (error) {
      alert("Error al aprobar pitch: " + error.message);
    } else {
      // Actualizar estado local
      setMedios(medios.map(m => m.id === selectedMedio.id ? { ...m, estado: 'Aprobado', pitch_generado: pitchText } : m));
      setShowModal(false);
    }
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
      {/* HEADER METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Medios en Radar</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>{medios.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Pitches Enviados</div>
          <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8 }}>{medios.filter(m => ['Enviado', 'Esperando_Respuesta', 'Interesado', 'Aceptado'].includes(m.estado)).length}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase' }}>Apariciones Aceptadas</div>
          <div style={{ fontSize: 27, fontWeight: 800, color: 'var(--success)', marginTop: 8 }}>{medios.filter(m => m.estado === 'Aceptado').length}</div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', color: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} /> Python Agents
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9 }}>
            Scout automatizado activo. Conectado a Supabase en tiempo real.
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Todos', 'TV', 'Radio', 'Prensa', 'Podcast', 'Redes'].map(t => (
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
        <div style={{ position: 'relative', width: 250 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--textSoft)' }} />
          <input 
            type="text" 
            placeholder="Buscar medio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px 8px 34px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', outline: 'none', fontSize: 13, fontWeight: 600
            }}
          />
        </div>
      </div>

      {/* LISTADO DE MEDIOS */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 4px 10px' }}>
          <div>Medio</div><div>Tipo</div><div>Alcance Estimado</div><div>Estado</div><div>Acción</div>
        </div>
        {filteredMedios.map(m => {
          const s = getStatusStyle(m.estado);
          return (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr', alignItems: 'center', padding: '14px 4px', borderTop: '1px solid var(--bg)', fontSize: 13.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: getAvatarBg(m.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  {getInitials(m.nombre)}
                </div>
                <div>
                  <div>{m.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 500 }}>{m.contacto || 'Sin email'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--textSoft)', fontWeight: 600 }}>
                {getTipoIcon(m.tipo)} {m.tipo || 'General'}
              </div>
              <div style={{ fontWeight: 600 }}>{m.alcance || 'N/A'}</div>
              <div>
                <span style={{ color: s.color, background: s.bg, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {m.estado.replace('_', ' ')}
                </span>
              </div>
              <div>
                <button
                  onClick={() => handleOpenPitch(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', color: 'var(--text)'
                  }}
                >
                  <Mail size={14} /> {m.estado === 'Nuevo' ? 'Redactar' : 'Revisar Pitch'}
                </button>
              </div>
            </div>
          )
        })}
        {filteredMedios.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--textSoft)', fontSize: 14 }}>
            No se han encontrado medios. El scout aún no ha metido datos o los filtros los ocultan.
          </div>
        )}
      </div>

      {/* MODAL REDACTAR PITCH */}
      {showModal && selectedMedio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 600, borderRadius: 20,
            border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: getAvatarBg(selectedMedio.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {getInitials(selectedMedio.nombre)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>Pitch a {selectedMedio.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--textSoft)', fontWeight: 600 }}>{selectedMedio.contacto}</div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--textSoft)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--textSoft)' }}>
                  {selectedMedio.estado === 'Nuevo' ? 'Redacta un mensaje:' : 'Mensaje propuesto por Agente IA:'}
                </span>
                {selectedMedio.estado === 'Nuevo' && (
                  <button 
                    onClick={generateAIPitch}
                    disabled={generating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7',
                      border: '1px solid rgba(168, 85, 247, 0.2)', padding: '6px 12px',
                      borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {generating ? <Bot size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />} 
                    {generating ? 'Generando...' : 'Autocompletar con IA'}
                  </button>
                )}
              </div>
              
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                placeholder="Escribe tu mensaje a la redacción aquí..."
                style={{
                  width: '100%', height: 220, padding: 16, borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none',
                  lineHeight: '1.5'
                }}
              />
            </div>
            
            <div style={{ padding: '16px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--textSoft)', fontWeight: 600 }}>
                Estado actual: {selectedMedio.estado.replace('_', ' ')}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cerrar
                </button>
                {(selectedMedio.estado === 'Nuevo' || selectedMedio.estado === 'Pendiente_Aprobacion') && (
                  <button 
                    onClick={handleApprovePitch}
                    disabled={!pitchText.trim()}
                    style={{ 
                      background: pitchText.trim() ? 'var(--accent)' : 'var(--border)', 
                      color: pitchText.trim() ? '#fff' : 'var(--textSoft)', 
                      border: 'none', padding: '8px 20px', borderRadius: 8, 
                      fontWeight: 700, cursor: pitchText.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}
                  >
                    <Send size={16} /> Aprobar Pitch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
