import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, Sparkles, X } from 'lucide-react';
import { consultarChefBot } from '../geminiService';
import ReactMarkdown from 'react-markdown';

export default function ChefBotView({ contextoDatos, selectedRestauranteId, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'model', text: '¡Hola! Soy **ChefBot**. Conozco todos tus albaranes, proveedores y escandallos. ¿En qué te puedo ayudar hoy con las finanzas del restaurante?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
    setLoading(true);

    try {
      // Limpiamos un poco el contexto para no mandar JSON infinito, nos quedamos con lo importante
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

      const reply = await consultarChefBot(userMsg, messages, ctx, selectedRestauranteId);
      
      const prefixes = ['¡Oído cocina! 🍳\n\n', '¡Sí, Chef! 👨‍🍳\n\n'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      setMessages(prev => [...prev, { role: 'model', text: prefix + reply }]);
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
      width: 400, 
      height: 600, 
      background: 'var(--bg)', 
      borderRadius: 24, 
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
      zIndex: 2000,
      border: '1px solid var(--border)',
      overflow: 'hidden'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)' }}>
            <Bot size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>ChefBot</h2>
            <p style={{ margin: 0, color: 'var(--textSoft)', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} color="var(--accent)" /> IA Financiera conectada
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 14, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
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
                maxWidth: '75%',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                padding: '14px 18px', borderRadius: 16,
                borderTopRightRadius: m.role === 'user' ? 4 : 16,
                borderTopLeftRadius: m.role === 'model' ? 4 : 16,
                fontSize: 14, lineHeight: 1.6, fontWeight: 500,
                boxShadow: m.role === 'user' ? '0 4px 10px rgba(59, 110, 165, 0.2)' : 'none',
                border: m.role === 'model' ? '1px solid var(--border)' : 'none'
              }}>
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
             <div style={{ display: 'flex', gap: 14 }}>
               <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--accentSoft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent)' }}>
                 <Bot size={18} />
               </div>
               <div style={{ background: 'var(--bg)', padding: '14px 18px', borderRadius: 16, borderTopLeftRadius: 4, display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
                 <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                 <span style={{ fontSize: 13, color: 'var(--textSoft)', marginLeft: 8 }}>Analizando albaranes...</span>
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
              placeholder="Pregúntale cuánto pagaste de luz o quién es el proveedor más caro..."
              style={{ flex: 1, padding: '16px 20px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 14.5, outline: 'none' }}
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
