import React, { useState, useMemo, useEffect } from 'react';
import { Camera, Sparkles, Copy, Check, Video, Image, Megaphone, Calendar, Send, Loader2, RefreshCw, ThumbsUp, Heart, MessageCircle, Share2, AlertCircle, Settings, CheckCircle2, Globe, ExternalLink, X, Link } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { publicarEnInstagram } from '../utils/instagramService';
import { obtenerUrlMetaOAuth, canjearCodigoPorTokenLargaDuracion } from '../utils/instagramOAuthService';

export default function MarketingSocialView({ platos = [], restaurantes = [], selectedRestauranteId }) {
  const [selectedPlatoId, setSelectedPlatoId] = useState('');
  const [tipoContenido, setTipoContenido] = useState('post'); // 'post', 'reel', 'promocion'
  const [estiloTono, setEstiloTono] = useState('gourmet'); // 'gourmet', 'cercano', 'divertido', 'elegante'
  const [promocionCustomText, setPromocionCustomText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);

  // Estado para publicación en Instagram
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Configuración local de Instagram por restaurante
  const [configRestaurantes, setConfigRestaurantes] = useState({
    '68d0128c-d047-48d4-8cbe-08fe151aa632': { handle: '@silvestre_tirso', webhookUrl: '', accountId: '', token: '' },
    '9b5f1982-fb46-43cb-a393-387ec6f658ff': { handle: '@silvestre_becerril', webhookUrl: '', accountId: '', token: '' }
  });

  const [historialPosts, setHistorialPosts] = useState([
    {
      id: '1',
      titulo: 'Hamburguesa Silvestre Gourmet',
      tipo: 'post',
      caption: '🔥 ¿Has probado ya nuestra Hamburguesa Silvestre con carne madurada y cheddar artesano? Un bocado cremoso e inolvidable. Te esperamos esta noche en la terraza. 🍷\n\nReserva tu mesa en el enlace de la bio.',
      hashtags: '#SilvestreRestaurante #HamburguesaGourmet #FoodieMadrid #Gastronomia #VinosYComidas',
      creado_en: 'Hace 2 horas',
      estado: 'Listo para subir'
    }
  ]);

  // Restaurante activo
  const restauranteActivo = useMemo(() => {
    if (!restaurantes.length) return { id: 'default', nombre: 'Silvestre Vinos & Comidas' };
    return restaurantes.find(r => r.id === selectedRestauranteId) || restaurantes[0];
  }, [restaurantes, selectedRestauranteId]);

  const configActiva = useMemo(() => {
    const defaultHandle = `@${restauranteActivo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    return configRestaurantes[restauranteActivo.id] || { handle: defaultHandle, webhookUrl: '', accountId: '', token: '' };
  }, [configRestaurantes, restauranteActivo]);

  // Capturar respuesta de redirección OAuth de Meta (?code=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const error = searchParams.get('error_description') || searchParams.get('error');

    if (error) {
      setPublishFeedback({
        type: 'error',
        message: `Error de autorización en Meta: ${error}`
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      const storedAppId = localStorage.getItem('meta_app_id');
      const storedAppSecret = localStorage.getItem('meta_app_secret');
      const redirectUri = window.location.origin + window.location.pathname;

      if (storedAppId) {
        setIsPublishing(true);
        canjearCodigoPorTokenLargaDuracion({
          code: code,
          appId: storedAppId,
          appSecret: storedAppSecret,
          redirectUri: redirectUri
        })
          .then(res => {
            setConfigRestaurantes(prev => ({
              ...prev,
              [restauranteActivo.id]: {
                ...prev[restauranteActivo.id],
                accountId: res.instagramAccountId,
                token: res.accessToken
              }
            }));

            setPublishFeedback({
              type: 'success',
              message: `¡Conexión Meta OAuth completada! Cuenta Instagram vinculada: ${res.pageName} (ID: ${res.instagramAccountId})`
            });
          })
          .catch(err => {
            setPublishFeedback({
              type: 'error',
              message: `Fallo al procesar autenticación OAuth: ${err.message}`
            });
          })
          .finally(() => {
            setIsPublishing(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      }
    }
  }, [restauranteActivo]);

  // Plato seleccionado
  const platoSeleccionado = useMemo(() => {
    return platos.find(p => p.id === selectedPlatoId) || null;
  }, [platos, selectedPlatoId]);

  // Generar publicación usando Gemini API
  const handleGeneratePost = async () => {
    setLoading(true);
    setGeneratedResult(null);
    setPublishFeedback(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setTimeout(() => {
        const nombrePlato = platoSeleccionado ? platoSeleccionado.nombre : 'Especialidad Silvestre';
        const precio = platoSeleccionado ? `${platoSeleccionado.precio_venta}€` : 'nuestro precio especial';
        
        setGeneratedResult({
          caption: `✨ Descubre la magia de ${nombrePlato} en ${restauranteActivo.nombre}.\n\nPreparado con ingredientes seleccionados de primera calidad a solo ${precio}. La combinación perfecta entre tradición y sabor de vanguardia.\n\n📍 ¿Te vienes a probarlo hoy? Haz tu reserva directa en el link de la biografía. 🍷`,
          hashtags: ['#Gastronomia', '#FoodieMadrid', '#RestaurantesMadrid', `#${nombrePlato.replace(/\s+/g, '')}`, '#VinosYComidas'],
          hook_inicial: '¡No vas a creer el sabor de este plato estrella!',
          reel_script: [
            'TOMA 1 (0-3s): Primer plano cenital del plato humeante recién servido.',
            'TOMA 2 (3-6s): Detalle del corte de los ingredientes o vertido de la salsa.',
            'TOMA 3 (6-10s): Comensal sonriendo al dar el primer bocado con copa de vino.'
          ],
          best_time: 'Hoy entre las 13:30h y las 15:00h (Hora de comida en España)',
          visual_idea: 'Foto con iluminación cálida lateral, desenfoque de fondo y copa de vino de acompañamiento.'
        });
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const itemNombre = platoSeleccionado ? platoSeleccionado.nombre : promocionCustomText || 'Menú Especial del Día';
      const itemCategoria = platoSeleccionado ? platoSeleccionado.categoria : 'Gastronomía';
      const itemPrecio = platoSeleccionado ? `${platoSeleccionado.precio_venta}€` : '';

      const promptText = `
Eres un Community Manager estrella experto en marketing gastronómico y restaurantes de alta gama para Instagram y TikTok.
Genera una propuesta de publicación persuasiva y moderna para el restaurante "${restauranteActivo.nombre}".

DATOS DEL PRODUCTO:
- Producto / Evento: ${itemNombre}
- Categoría: ${itemCategoria}
- Precio: ${itemPrecio}
- Detalles adicionales: ${promocionCustomText}
- Tipo de Contenido solicitado: ${tipoContenido} (post = Publicación normal, reel = Guión para Reel/TikTok, promocion = Oferta especial)
- Tono deseado: ${estiloTono}

INSTRUCCIONES DE FORMATO:
Responde ÚNICAMENTE con un JSON válido estructurado así:
{
  "caption": "El texto descriptivo completo del post con emojis adecuados y call-to-action",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
  "hook_inicial": "Frase gancho para llamar la atención en los primeros 3 segundos",
  "reel_script": ["Tomas de video sugeridas paso a paso para Reels"],
  "best_time": "Mejor hora para publicar en Instagram",
  "visual_idea": "Sugerencia de cómo tomar la foto o encuadrar el plato"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text);
      setGeneratedResult(parsed);
    } catch (err) {
      console.error("Error al generar post con Gemini:", err);
      setGeneratedResult({
        caption: `🍇 ¡La experiencia gastronómica que estabas buscando! Ven a probar ${platoSeleccionado?.nombre || 'nuestras especialidades'} a ${restauranteActivo.nombre}.\n\nUn bocado lleno de carácter, maridado con nuestra selección de vinos. 🍷`,
        hashtags: ['#Restaurantes', '#Foodies', '#Silvestre', '#MadridGourmet'],
        hook_inicial: 'Guarda este vídeo para tu próxima cena',
        reel_script: ['Toma 1: Servido del plato', 'Toma 2: Brindis con copas'],
        best_time: '19:30 - 21:00h',
        visual_idea: 'Encuadre cenital con luz natural.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Publicar directamente en la cuenta de Instagram del restaurante
  const handlePublicarDirectoInstagram = async () => {
    if (!generatedResult) return;

    setIsPublishing(true);
    setPublishFeedback(null);

    const imageUrl = platoSeleccionado?.imagen_url || platoSeleccionado?.imagenUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80';
    
    const objRestaurante = {
      ...restauranteActivo,
      instagram_handle: configActiva.handle,
      instagram_webhook_url: configActiva.webhookUrl,
      instagram_account_id: configActiva.accountId,
      instagram_access_token: configActiva.token
    };

    try {
      const res = await publicarEnInstagram({
        restaurante: objRestaurante,
        imageUrl: imageUrl,
        caption: generatedResult.caption,
        hashtags: generatedResult.hashtags
      });

      setPublishFeedback({
        type: 'success',
        message: res.message
      });

      // Añadir al historial de publicaciones enviadas
      const nuevoPost = {
        id: Date.now().toString(),
        titulo: platoSeleccionado ? platoSeleccionado.nombre : 'Promoción Instagram',
        tipo: tipoContenido,
        caption: generatedResult.caption,
        hashtags: generatedResult.hashtags.join(' '),
        creado_en: 'Justo ahora',
        estado: `Publicado en ${configActiva.handle}`
      };
      setHistorialPosts([nuevoPost, ...historialPosts]);
    } catch (err) {
      setPublishFeedback({
        type: 'error',
        message: err.message
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyCaption = () => {
    if (!generatedResult) return;
    const fullText = `${generatedResult.caption}\n\n${generatedResult.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGuardarEnBorradores = () => {
    if (!generatedResult) return;
    const nuevoPost = {
      id: Date.now().toString(),
      titulo: platoSeleccionado ? platoSeleccionado.nombre : 'Promoción Generada',
      tipo: tipoContenido,
      caption: generatedResult.caption,
      hashtags: generatedResult.hashtags.join(' '),
      creado_en: 'Justo ahora',
      estado: 'Borrador'
    };
    setHistorialPosts([nuevoPost, ...historialPosts]);
  };

  const handleSaveConfig = (newConf) => {
    setConfigRestaurantes(prev => ({
      ...prev,
      [restauranteActivo.id]: newConf
    }));
    setShowConfigModal(false);
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HEADER DE LA SECCIÓN */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #e1306c, #f77737)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <Camera size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              Studio de Marketing & Instagram (IA)
            </h2>
            <div style={{ fontSize: 13, color: 'var(--textSoft)', marginTop: 2 }}>
              Crea publicaciones y publica directamente en <b style={{ color: 'var(--accent)' }}>{configActiva.handle}</b> ({restauranteActivo.nombre})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 12,
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Settings size={15} style={{ color: 'var(--accent)' }} /> Configurar Cuenta Instagram
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(225, 48, 108, 0.1)', borderRadius: 20, border: '1px solid rgba(225, 48, 108, 0.2)' }}>
            <Sparkles size={14} style={{ color: '#e1306c' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e1306c' }}>IA Creador Activo</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* FORMULARIO DE GENERACIÓN */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Megaphone size={18} style={{ color: 'var(--accent)' }} /> Configurar Publicación
          </h3>

          {/* SELECTOR DE PLATO DE LA CARTA */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              1. Selecciona un Plato de tus Escandallos (Opcional)
            </label>
            <select
              value={selectedPlatoId}
              onChange={(e) => setSelectedPlatoId(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, fontWeight: 600, outline: 'none'
              }}
            >
              <option value="">-- Usar tema o promoción personalizada --</option>
              {platos.map(p => (
                <option key={p.id} value={p.id}>
                  🍽️ {p.nombre} ({p.precio_venta}€) - {p.categoria || 'Principal'}
                </option>
              ))}
            </select>
          </div>

          {/* DETALLES DE PROMOCIÓN CUSTOM */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              2. Detalles / Promoción Especial (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: 2x1 en cócteles los jueves, Menú Degustación Otoño..."
              value={promocionCustomText}
              onChange={(e) => setPromocionCustomText(e.target.value)}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* FORMATO DE CONTENIDO */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              3. Formato de Contenido
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { id: 'post', label: 'Post Feed', icon: <Image size={14} /> },
                { id: 'reel', label: 'Script Reel', icon: <Video size={14} /> },
                { id: 'promocion', label: 'Promo Flash', icon: <Megaphone size={14} /> }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTipoContenido(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 8px', borderRadius: 10,
                    border: tipoContenido === f.id ? '1px solid #e1306c' : '1px solid var(--border)',
                    background: tipoContenido === f.id ? 'rgba(225, 48, 108, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: tipoContenido === f.id ? '#e1306c' : 'var(--text)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* ESTILO O TONO */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              4. Tono de la Publicación
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'gourmet', label: '✨ Gourmet & Elegante' },
                { id: 'cercano', label: '😊 Cercano & Amigable' },
                { id: 'divertido', label: '🔥 Moderno & Cañero' },
                { id: 'urgencia', label: '⏳ Edición Limitada' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEstiloTono(t.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                    border: estiloTono === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: estiloTono === t.id ? 'rgba(59, 110, 165, 0.15)' : 'rgba(255,255,255,0.03)',
                    color: estiloTono === t.id ? 'var(--accentLight)' : 'var(--text)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* BOTÓN GENERAR */}
          <button
            onClick={handleGeneratePost}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #e1306c, #f77737)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(225, 48, 108, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
            {loading ? 'Redactando con Gemini...' : 'Generar Publicación con IA'}
          </button>
        </div>

        {/* RESULTADO Y MOCKUP INSTAGRAM */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Camera size={18} style={{ color: '#e1306c' }} /> Previsualización Instagram ({configActiva.handle})
            </h3>

            {!generatedResult && !loading && (
              <div style={{
                textAlign: 'center', padding: '50px 20px', color: 'var(--textSoft)',
                background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed var(--border)'
              }}>
                <Camera size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Sin publicación generada aún</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Configura las opciones a la izquierda y pulsa en "Generar Publicación".
                </div>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--textSoft)' }}>
                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#e1306c', marginBottom: 14 }} />
                <div style={{ fontSize: 14, fontWeight: 700 }}>Diseñando contenido gastronómico...</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Gemini 2.5 optimizando hooks y hashtags</div>
              </div>
            )}

            {generatedResult && !loading && (
              <div>
                {/* ALERTAS DE FEEDBACK DE PUBLICACIÓN */}
                {publishFeedback && (
                  <div style={{
                    marginBottom: 16, padding: '12px 16px', borderRadius: 12,
                    background: publishFeedback.type === 'success' ? 'var(--successSoft)' : 'var(--dangerSoft)',
                    border: `1px solid ${publishFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: publishFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    {publishFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <div>{publishFeedback.message}</div>
                  </div>
                )}

                {/* MOCKUP CARD DE INSTAGRAM */}
                <div style={{
                  background: '#000000',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: 16,
                  color: '#fff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {/* CABECERA POST */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e1306c, #f77737)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 12
                    }}>
                      {configActiva.handle.slice(1, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{configActiva.handle} ({restauranteActivo.nombre})</div>
                      <div style={{ fontSize: 10, color: '#8b949e' }}>Publicación oficial sugerida</div>
                    </div>
                  </div>

                  {/* HOOK O IDEA VISUAL SI ES REEL */}
                  {tipoContenido === 'reel' && generatedResult.hook_inicial && (
                    <div style={{
                      background: 'rgba(225, 48, 108, 0.2)',
                      border: '1px solid rgba(225, 48, 108, 0.4)',
                      borderRadius: 10, padding: 10, marginBottom: 12
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#e1306c', textTransform: 'uppercase' }}>
                        🎯 Gancho Inicial (3 primeros segundos):
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: '#fff' }}>
                        "{generatedResult.hook_inicial}"
                      </div>
                    </div>
                  )}

                  {/* CAPTION GENERADO */}
                  <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#e6edf3' }}>
                    {generatedResult.caption}
                  </div>

                  {/* HASHTAGS */}
                  <div style={{ fontSize: 12, color: '#58a6ff', marginTop: 12, fontWeight: 600 }}>
                    {generatedResult.hashtags ? generatedResult.hashtags.join(' ') : ''}
                  </div>

                  {/* TOMAS DE REEL SI APLICA */}
                  {tipoContenido === 'reel' && generatedResult.reel_script && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>
                        🎬 Guión de tomas de vídeo recomendadas:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#8b949e', lineHeight: 1.5 }}>
                        {generatedResult.reel_script.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* FOOTER METADATA */}
                  <div style={{
                    marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8b949e'
                  }}>
                    <span>⏰ {generatedResult.best_time || 'Publicar a las 14:00h'}</span>
                    <span>💡 {generatedResult.visual_idea ? 'Foto cenital recomendada' : ''}</span>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={handlePublicarDirectoInstagram}
                    disabled={isPublishing}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '13px', borderRadius: 12,
                      background: 'linear-gradient(135deg, #e1306c, #f77737)',
                      border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 800, cursor: isPublishing ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(225, 48, 108, 0.4)'
                    }}
                  >
                    {isPublishing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                    {isPublishing ? 'Publicando en Instagram...' : `🚀 Publicar Directo en Instagram (${configActiva.handle})`}
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleCopyCaption}
                      style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px', borderRadius: 10,
                        background: copied ? 'var(--success)' : 'var(--accent)',
                        border: 'none', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? '¡Copiado!' : 'Copiar Texto'}
                    </button>

                    <button
                      onClick={handleGuardarEnBorradores}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                        color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Guardar Borrador
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* HISTORIAL DE PUBLICACIONES GUARDADAS */}
      <div style={{
        marginTop: 32,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: 24
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} style={{ color: 'var(--accent)' }} /> Mis Publicaciones Programadas / Guardadas
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
          {historialPosts.map(post => (
            <div
              key={post.id}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 16
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 6,
                  background: post.tipo === 'reel' ? 'rgba(225, 48, 108, 0.15)' : 'rgba(59, 110, 165, 0.15)',
                  color: post.tipo === 'reel' ? '#e1306c' : 'var(--accentLight)'
                }}>
                  {post.tipo}
                </span>
                <span style={{ fontSize: 11, color: 'var(--textSoft)' }}>{post.creado_en}</span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                {post.titulo}
              </div>

              <div style={{
                fontSize: 12, color: 'var(--textSoft)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {post.caption}
              </div>

              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                  ✓ {post.estado}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${post.caption}\n\n${post.hashtags}`);
                    alert('¡Texto de la publicación copiado!');
                  }}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--accentLight)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CONFIGURACIÓN INSTAGRAM POR RESTAURANTE */}
      {showConfigModal && (
        <InstagramConfigModal
          restaurante={restauranteActivo}
          config={configActiva}
          onSave={handleSaveConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}

function InstagramConfigModal({ restaurante, config, onSave, onClose }) {
  const [handle, setHandle] = useState(config.handle || '');
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
  const [accountId, setAccountId] = useState(config.accountId || '');
  const [token, setToken] = useState(config.token || '');
  
  const [metaAppId, setMetaAppId] = useState(localStorage.getItem('meta_app_id') || '');
  const [metaAppSecret, setMetaAppSecret] = useState(localStorage.getItem('meta_app_secret') || '');

  const handleIniciarOAuth = () => {
    if (!metaAppId) {
      alert('Por favor introduce tu Meta App ID para iniciar la autenticación OAuth.');
      return;
    }

    localStorage.setItem('meta_app_id', metaAppId);
    if (metaAppSecret) localStorage.setItem('meta_app_secret', metaAppSecret);

    const redirectUri = window.location.origin + window.location.pathname;
    try {
      const authUrl = obtenerUrlMetaOAuth({
        appId: metaAppId,
        redirectUri: redirectUri,
        state: restaurante.id
      });
      window.location.href = authUrl;
    } catch (err) {
      alert(`Error al construir URL de OAuth: ${err.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: 16
    }}>
      <div style={{
        background: 'var(--surface)', width: '100%', maxWidth: 520, borderRadius: 24,
        border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        padding: 24, display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #e1306c, #f77737)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>Ajustes de Instagram</div>
              <div style={{ fontSize: 12, color: 'var(--textSoft)' }}>{restaurante.nombre}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--textSoft)', lineHeight: 1.5 }}>
          Configura cómo publicar de forma real en la cuenta oficial de Instagram de este local.
        </div>

        {/* HANDLE / USUARIO INSTAGRAM */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 6 }}>
            Handle / Usuario Instagram:
          </label>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            placeholder="@silvestre_tirso"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
          />
        </div>

        {/* OPCIÓN 1: WEBHOOK (MAKE / N8N) */}
        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={15} /> Opción 1: Webhook (Make.com / n8n / Zapier) [Recomendado]
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--textSoft)', marginBottom: 10 }}>
            Pega aquí la URL de tu Webhook en Make.com que publica en Instagram sin necesidad de Meta App Review.
          </div>
          <input
            type="text"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hook.eu1.make.com/xxxxxxxxx"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12.5, outline: 'none' }}
          />
        </div>

        {/* OPCIÓN 2: META GRAPH API & OAUTH 2.0 */}
        <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#e1306c', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={15} /> Opción 2: Meta Graph API (OAuth 2.0 Directo)
          </div>
          
          {/* LOGIN OAUTH 2.0 */}
          <div style={{ marginTop: 10, marginBottom: 14, padding: 12, borderRadius: 12, background: 'rgba(225, 48, 108, 0.08)', border: '1px solid rgba(225, 48, 108, 0.2)' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
              🔗 Conectar Cuenta con Meta OAuth 2.0:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Meta App ID"
                value={metaAppId}
                onChange={e => setMetaAppId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Meta App Secret"
                value={metaAppSecret}
                onChange={e => setMetaAppSecret(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, outline: 'none' }}
              />
            </div>
            <button
              type="button"
              onClick={handleIniciarOAuth}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                background: 'linear-gradient(135deg, #1877f2, #4267b2)',
                border: 'none', color: '#fff', fontSize: 12, fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <ExternalLink size={14} /> Iniciar Sesión con Facebook / Instagram (OAuth 2.0)
            </button>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>
            O introduce credenciales manuales obtenidas de Graph API Explorer:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Instagram Account ID (ej: 1784140000000)"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, outline: 'none' }}
            />
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="User/Page Access Token de Meta"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, outline: 'none' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave({ handle, webhookUrl, accountId, token })}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
          >
            Guardar Ajustes
          </button>
        </div>
      </div>
    </div>
  );
}
