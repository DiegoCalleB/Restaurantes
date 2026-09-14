import React, { useState, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Printer, Copy, ExternalLink, Check, Sparkles, Sliders, Eye, FileText, Smartphone } from 'lucide-react';

export default function CartaQRView({ restaurantes = [], selectedRestauranteId, onVerCartaPublica }) {
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(240);
  const [textoPeana, setTextoPeana] = useState('Escanea con tu cámara para ver la Carta Digital y Alérgenos');
  const [numMesa, setNumMesa] = useState('Mesa 01');
  const qrRef = useRef(null);

  // Restaurante activo
  const restauranteActivo = useMemo(() => {
    if (!restaurantes.length) return { nombre: 'Silvestre Vinos & Comidas', id: 'default' };
    return restaurantes.find(r => r.id === selectedRestauranteId) || restaurantes[0];
  }, [restaurantes, selectedRestauranteId]);

  // URL pública simulada/real de la carta
  const baseUrl = window.location.origin + window.location.pathname;
  const urlCartaPublica = `${baseUrl}?view=carta_publica&restaurante_id=${restauranteActivo.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(urlCartaPublica);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Función para descargar el QR como PNG
  const handleDownloadQR = () => {
    const svgElement = document.getElementById('qr-code-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = qrSize * 2; // Alta definición (Retina)
      canvas.height = qrSize * 2;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_Carta_${restauranteActivo.nombre.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Imprimir Peanas de Mesa
  const handlePrintPeana = () => {
    window.print();
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* HEADER DE LA VISTA */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Generador de Código QR & Peanas de Mesa</h2>
              <div style={{ fontSize: 13, color: 'var(--textSoft)' }}>Carta Digital interactiva para {restauranteActivo.nombre}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => onVerCartaPublica && onVerCartaPublica()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Eye size={16} /> Previsualizar Carta
          </button>

          <button
            onClick={handlePrintPeana}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)'
            }}
          >
            <Printer size={16} /> Imprimir Peana para Mesa
          </button>
        </div>
      </div>

      {/* ENLACE PÚBLICO RAPIDO */}
      <div style={{
        background: 'rgba(59, 110, 165, 0.08)',
        border: '1px solid rgba(59, 110, 165, 0.2)',
        borderRadius: 16,
        padding: '16px 20px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Smartphone size={20} style={{ color: 'var(--accentLight)' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accentLight)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              URL pública de tu carta digital
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, fontFamily: 'monospace', marginTop: 2, wordBreak: 'break-all' }}>
              {urlCartaPublica}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: copied ? 'var(--success)' : 'var(--surface)',
              border: '1px solid var(--border)',
              color: copied ? '#fff' : 'var(--text)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>
          <a
            href={urlCartaPublica}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: 12, fontWeight: 700, textDecoration: 'none'
            }}
          >
            <ExternalLink size={14} /> Abrir
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 24 }}>
        
        {/* PANEL DE PERSONALIZACIÓN DEL QR */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Sliders size={18} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Personalizar Código QR</h3>
          </div>

          {/* PALETA DE COLOR DEL QR */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              Color del Código QR
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { name: 'Negro Clásico', color: '#000000' },
                { name: 'Dorado Silvestre', color: '#d97706' },
                { name: 'Azul Noche', color: '#1e3a8a' },
                { name: 'Verde Botella', color: '#064e3b' }
              ].map(c => (
                <div
                  key={c.color}
                  onClick={() => setQrColor(c.color)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: c.color,
                    cursor: 'pointer',
                    border: qrColor === c.color ? '3px solid var(--accent)' : '2px solid rgba(255,255,255,0.2)',
                    boxShadow: qrColor === c.color ? '0 0 10px rgba(59, 110, 165, 0.5)' : 'none'
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* TEXTO DE LA PEANA */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              Mensaje en el cartel / Peana de mesa
            </label>
            <input
              type="text"
              value={textoPeana}
              onChange={(e) => setTextoPeana(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* IDENTIFICADOR DE MESA (EJ: MESA 01, MESA TERRAZA) */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 8 }}>
              Identificador / Etiqueta de Mesa (Opcional)
            </label>
            <input
              type="text"
              value={numMesa}
              onChange={(e) => setNumMesa(e.target.value)}
              placeholder="Ej: Mesa 01, Terraza A, Barra 3"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={handleDownloadQR}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12,
              background: 'var(--surfaceLight)',
              border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Download size={16} /> Descargar QR PNG High-Res
          </button>
        </div>

        {/* PREVIEW DE LA PEANA DE MESA IMPRIMIBLE */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            VISTA PREVIA DEL CARTEL DE MESA
          </div>

          {/* CONTENEDOR IMPRIMIBLE DE LA PEANA */}
          <div 
            className="peana-mesa-print"
            style={{
              width: 280,
              background: '#ffffff',
              borderRadius: 18,
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
              color: '#1a1a1a',
              border: '2px solid #e5e7eb'
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.15em', color: '#d97706', textTransform: 'uppercase' }}>
              {numMesa}
            </div>

            <div style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '4px 0 16px', fontFamily: 'serif' }}>
              {restauranteActivo.nombre}
            </div>

            {/* RENDER CÓDIGO QR */}
            <div style={{
              display: 'inline-block',
              padding: 12,
              background: bgColor,
              borderRadius: 14,
              border: '1px solid #f3f4f6'
            }}>
              <QRCodeSVG
                id="qr-code-svg"
                value={urlCartaPublica}
                size={160}
                fgColor={qrColor}
                bgColor={bgColor}
                level="H"
                includeMargin={false}
              />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', marginTop: 16, lineHeight: 1.4 }}>
              {textoPeana}
            </div>

            <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 12, fontWeight: 600 }}>
              CARTA DIGITAL & ALÉRGENOS UE 1169/2011
            </div>
          </div>
        </div>

      </div>

      {/* ESTILOS DE IMPRESIÓN EXCLUSIVOS EN CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .peana-mesa-print, .peana-mesa-print * {
            visibility: visible;
          }
          .peana-mesa-print {
            position: absolute;
            left: 50%;
            top: 40%;
            transform: translate(-50%, -50%) scale(1.4);
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
