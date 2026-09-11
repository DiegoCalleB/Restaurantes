import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles, X, Megaphone, Check, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import { consultarChefBot } from '../geminiService';
import ReactMarkdown from 'react-markdown';

function ActionScoutCard({ action, onNavigate }) {
  const [ordenStatus, setOrdenStatus] = useState('Pendiente');
  const [mediosEncontrados, setMediosEncontrados] = useState([]);
  const [loadingScout, setLoadingScout] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const checkOrderStatus = async () => {
      try {
        const { supabase } = await import('../supabaseClient');
        
        // 1. Consultar estado de la orden
        if (action.ordenId) {
          const { data: ordenData } = await supabase
            .from('rrpp_ordenes_busqueda')
            .select('estado')
            .eq('id', action.ordenId)
            .single();

          if (ordenData && isMounted) {
            setOrdenStatus(ordenData.estado);
          }
        }

        // 2. Traer los últimos 3 medios creados para ver resultados
        const { data: medios } = await supabase
          .from('rrpp_medios')
          .select('*')
          .order('creado_en', { ascending: false })
          .limit(4);

        if (medios && isMounted) {
          setMediosEncontrados(medios);
        }
      } catch (err) {
        console.error("Error comprobando estado Scout:", err);
      } finally {
        if (isMounted) setLoadingScout(false);
      }
    };

    checkOrderStatus();
    intervalId = setInterval(checkOrderStatus, 2500);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [action.ordenId]);

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} /> Agente Scout RRPP
        </span>
        <span style={{ 
          fontSize: 11, 
          background: ordenStatus === 'Completado' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(242, 201, 76, 0.1)', 
          color: ordenStatus === 'Completado' ? 'var(--success)' : 'var(--warning)', 
          padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
        }}>
          {ordenStatus === 'Completado' ? '✅ Búsqueda Completada' : ordenStatus === 'Procesando' ? '⚙️ Peinando la red...' : '⏳ En Cola'}
        </span>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        🔍 Buscando: <b>"{action.termino}"</b>
      </div>

      {ordenStatus !== 'Completado' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--textSoft)', padding: '6px 0' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Investigando contactos de prensa e influencers...</span>
        </div>
      )}

      {ordenStatus === 'Completado' && mediosEncontrados.length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', marginBottom: 6 }}>
            Últimos Contactos Añadidos al Radar:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mediosEncontrados.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>{m.contacto}</div>
                </div>
                <span style={{ fontSize: 10, background: 'var(--accentSoft)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                  {m.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onNavigate && (
        <button
          onClick={() => onNavigate('promocion')}
          style={{ width: '100%', marginTop: 6, background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Megaphone size={14} /> Abrir Pestaña de Promoción y RRPP <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function ActionMediosEncontradosCard({ action, onNavigate }) {
  const { termino, medios } = action;

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} /> Contactos Encontrados e Insertados
        </span>
        <span style={{ 
          fontSize: 11, 
          background: 'rgba(39, 174, 96, 0.1)', 
          color: 'var(--success)', 
          padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
        }}>
          ✅ Añadidos a Supabase
        </span>
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
        🔍 Búsqueda: <b>"{termino}"</b>
      </div>

      {medios && medios.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {medios.map((m, i) => (
            <div key={m.id || i} style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{m.nombre}</span>
                <span style={{ fontSize: 10, background: 'var(--accentSoft)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                  {m.tipo}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 11.5, fontWeight: 600, marginBottom: 4 }}>
                <Mail size={12} /> {m.contacto}
              </div>
              {m.alcance && (
                <div style={{ fontSize: 11, color: 'var(--textSoft)', marginBottom: 2 }}>
                  📍 <b>Alcance:</b> {m.alcance}
                </div>
              )}
              {m.enfoque_editorial && (
                <div style={{ fontSize: 11, color: 'var(--textSoft)', fontStyle: 'italic' }}>
                  "{m.enfoque_editorial}"
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--textSoft)', marginBottom: 10 }}>
          No se encontraron nuevos contactos únicos o ya estaban registrados.
        </div>
      )}

      {onNavigate && (
        <button
          onClick={() => onNavigate('promocion')}
          style={{ width: '100%', marginTop: 4, background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Megaphone size={14} /> Ver Radar de Medios en Pestaña RRPP <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function ActionPitchCard({ action, onNavigate }) {
  const [pitchText, setPitchText] = useState(action.pitchText || '');
  const [status, setStatus] = useState(action.status || 'pending');
  const [saving, setSaving] = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    try {
      const { supabase } = await import('../supabaseClient');
      const { data: existing } = await supabase.from('rrpp_medios').select('*').eq('nombre', action.medioNombre);
      
      if (existing && existing.length > 0) {
        await supabase.from('rrpp_medios').update({ estado: 'Aprobado', pitch_generado: pitchText }).eq('id', existing[0].id);
      } else {
        await supabase.from('rrpp_medios').insert({
          nombre: action.medioNombre,
          contacto: 'contacto@medio.com',
          tipo: 'Prensa',
          alcance: 'Nacional',
          estado: 'Aprobado',
          pitch_generado: pitchText,
          enfoque_editorial: 'Propuesto desde ChefBot (IA Virtual Manager)'
        });
      }
      setStatus('applied');
    } catch (e) {
      console.error("Error aprobando pitch:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} /> Pitch Propuesto: {action.medioNombre}
        </span>
        <span style={{ fontSize: 11, background: status === 'applied' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(242, 201, 76, 0.1)', color: status === 'applied' ? 'var(--success)' : 'var(--warning)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
          {status === 'applied' ? '✅ Pitch Aprobado' : '⏳ Pendiente Aprobación'}
        </span>
      </div>
      
      {status === 'applied' ? (
        <div style={{ fontSize: 12.5, color: 'var(--textSoft)', padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>El pitch para <b>{action.medioNombre}</b> ha sido aprobado y guardado en la base de datos de RRPP.</div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('promocion')}
              style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
            >
              <Megaphone size={14} /> Ver en Pestaña RRPP <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <>
          <textarea
            value={pitchText}
            onChange={e => setPitchText(e.target.value)}
            rows={5}
            style={{ width: '100%', fontSize: 12.5, padding: 10, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, marginBottom: 10 }}
          />
          <button
            onClick={handleApprove}
            disabled={saving || !pitchText.trim()}
            style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />} 
            {saving ? 'Guardando en Supabase...' : 'Aprobar Pitch y Guardar en RRPP'}
          </button>
        </>
      )}
    </div>
  );
}

export default function ChefBotView({ contextoDatos, selectedRestauranteId, isOpen, onClose, onNavigate }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Hola! Soy **ChefBot**. Conozco todos tus albaranes, proveedores, escandallos y relaciones públicas. ¿En qué te puedo ayudar hoy con la gestión del restaurante?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('ChefBot está pensando...');
  const messagesEndRef = useRef(null);

  const getLoadingMessage = (query) => {
    if (!query) return 'ChefBot está pensando...';
    const q = query.toLowerCase();

    if (/tiktok|instagram|youtube|influencer|medio|prensa|rrpp|periodico|revista|tv|radio|promo|promocion|contactos|difusion/i.test(q)) {
      return 'Buscando medios, influencers y contactos...';
    }
    if (/plato|escandallo|receta|ingrediente|menu|carta|pvp|precio|coste plato|rentabilidad plato/i.test(q)) {
      return 'Revisando escandallos y precios de la carta...';
    }
    if (/proveedor|albaran|factura|compra|gasto|luz|agua|alquiler|pedidos|articulos/i.test(q)) {
      return 'Analizando albaranes y facturas...';
    }
    if (/finanzas|beneficio|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|enero|febrero|balance|rentabilidad/i.test(q)) {
      return 'Calculando métricas financieras...';
    }
    return 'ChefBot está pensando...';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoadingMsg(getLoadingMessage(userMsg));
    setLoading(true);

    try {
      const ctx = {
        proveedores: contextoDatos.proveedores.map(p => ({ nombre: p.nombre })),
        albaranes: contextoDatos.albaranes.map(a => ({
          fecha: a.fecha,
          proveedor: a.proveedor,
          total: a.importe,
          articulos: a.items ? a.items.map(i => `${i.cantidad} de ${i.producto} a ${i.precio}€`) : []
        })),
        platos: contextoDatos.platos.map(p => ({
          nombre: p.nombre,
          coste: p.coste,
          pvp: p.precioVenta,
          margen: p.margenPct
        }))
      };

      const replyObj = await consultarChefBot(userMsg, messages, ctx, selectedRestauranteId);
      
      const replyText = typeof replyObj === 'object' ? replyObj.text : replyObj;
      const action = typeof replyObj === 'object' ? replyObj.action : null;

      const prefixes = ['¡Oído cocina! 🍳\n\n', '¡Sí, Chef! 👨‍🍳\n\n'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: prefix + replyText,
        action: action
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: `❌ **Error**: No he podido conectar con mi cerebro. Asegúrate de tener la API Key de Gemini configurada. (${error.message})` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: isOpen ? 'flex' : 'none', 
      flexDirection: 'column', 
      position: 'fixed', 
      bottom: 100, 
      right: 30, 
      width: 420, 
      height: 620, 
      background: 'var(--bg)', 
      borderRadius: 24, 
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
      zIndex: 2000,
      border: '1px solid var(--border)',
      overflow: 'hidden'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)' }}>
            <Bot size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>ChefBot</h2>
            <p style={{ margin: 0, color: 'var(--textSoft)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="var(--accent)" /> Virtual Manager & IA Conectada
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: 10, flex: 'none',
                background: m.role === 'user' ? 'var(--bg)' : 'var(--accentSoft)',
                color: m.role === 'user' ? 'var(--textSoft)' : 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${m.role === 'user' ? 'var(--border)' : 'var(--accent)'}`
              }}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={18} />}
              </div>
              <div style={{ 
                maxWidth: '82%',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                padding: '14px 18px', borderRadius: 16,
                borderTopRightRadius: m.role === 'user' ? 4 : 16,
                borderTopLeftRadius: m.role === 'model' ? 4 : 16,
                fontSize: 13.5, lineHeight: 1.6, fontWeight: 500,
                boxShadow: m.role === 'user' ? '0 4px 10px rgba(59, 110, 165, 0.2)' : 'none',
                border: m.role === 'model' ? '1px solid var(--border)' : 'none'
              }}>
                <ReactMarkdown>{m.text}</ReactMarkdown>

                {/* Tarjetas de Acción Propuesta (Human-in-the-Loop estilo BandManager) */}
                {m.action && m.action.type === 'rrpp_medios_encontrados' && (
                  <ActionMediosEncontradosCard 
                    action={m.action} 
                    onNavigate={onNavigate} 
                  />
                )}

                {m.action && m.action.type === 'propose_agent_trigger' && (
                  <ActionScoutCard 
                    action={m.action} 
                    onNavigate={onNavigate} 
                  />
                )}

                {m.action && m.action.type === 'propose_pitch_approval' && (
                  <ActionPitchCard 
                    action={m.action} 
                    onNavigate={onNavigate} 
                  />
                )}
              </div>
            </div>
          ))}
          {loading && (
             <div style={{ display: 'flex', gap: 12 }}>
               <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accentSoft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent)' }}>
                 <Bot size={18} />
               </div>
               <div style={{ background: 'var(--bg)', padding: '14px 18px', borderRadius: 16, borderTopLeftRadius: 4, display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                 <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                 <span style={{ fontSize: 13, color: 'var(--textSoft)', marginLeft: 8 }}>{loadingMsg}</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--surfaceDark)' }}>
          <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Pregúntale sobre gastos, escandallos o busca prensa..."
              style={{ flex: 1, padding: '16px 20px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14, outline: 'none' }}
              disabled={loading}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ width: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', background: input.trim() && !loading ? 'var(--accent)' : 'transparent', color: input.trim() && !loading ? '#fff' : 'var(--textSoft)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.2s' }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
