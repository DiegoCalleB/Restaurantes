import React, { useState, useRef } from 'react';
import { FileUp, CheckCircle, AlertTriangle, Loader2, Camera, RotateCw, RefreshCw, Sparkles, Upload, X } from 'lucide-react';
import { extraerDatosAlbaran } from '../geminiService';
import { subirArchivoBucket, guardarAlbaranExtraido } from '../supabaseClient';
import { compressAndRotateImage } from '../utils/imagenCompressor';

export default function SubirView({ setView, setSelectedId }) {
  // Estado: un array de objetos con la info de cada archivo
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Estado para la vista previa táctil tras disparar la cámara
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isCompressing, setIsCompressing] = useState(false);

  const processFile = async (uploadObj) => {
    try {
      // 1. Marcar como uploading
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'uploading' } : u));
      const imageUrl = await subirArchivoBucket(uploadObj.file);
      
      // 2. Marcar como processing
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'processing' } : u));
      const data = await extraerDatosAlbaran(uploadObj.file);
      
      // 3. Guardar en BD Supabase
      const albaranGuardado = await guardarAlbaranExtraido(data, imageUrl);
      data.dbId = albaranGuardado.id;
      
      // 4. Marcar como done
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'done', data } : u));
    } catch (error) {
      console.error("Error en archivo", uploadObj.name, error);
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'error', errorMsg: error.message } : u));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Si es una sola imagen capturada con la cámara, abrir vista previa interactiva
    if (files.length === 1 && files[0].type.startsWith('image/')) {
      const file = files[0];
      setPreviewFile(file);
      setRotation(0);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      handleFiles(files);
    }
  };

  const handleConfirmPreview = async () => {
    if (!previewFile) return;

    setIsCompressing(true);
    try {
      // 1. Comprimir y rotar la foto usando HTML5 Canvas API (reduce 15MB a ~400KB)
      const compressedFile = await compressAndRotateImage(previewFile, rotation, 1600, 2000, 0.82);

      // Limpiar vista previa
      setPreviewFile(null);
      setPreviewUrl(null);
      setRotation(0);

      // 2. Pasar al flujo normal de procesamiento
      await handleFiles([compressedFile]);
    } catch (err) {
      console.error("Error comprimiendo imagen:", err);
      alert("Error procesando la imagen: " + err.message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFiles = async (files) => {
    if (!files.length) return;
    const newUploads = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      status: 'idle',
      data: null,
      errorMsg: null
    }));
    setUploads(prev => [...prev, ...newUploads]);
    
    // Procesar secuencialmente para evitar el error 429
    for (let i = 0; i < newUploads.length; i++) {
      const u = newUploads[i];
      await processFile(u);
      
      if (i < newUploads.length - 1) {
        setUploads(prev => prev.map(up => up.id === newUploads[i+1].id ? { ...up, status: 'waiting_rate_limit' } : up));
        await new Promise(resolve => setTimeout(resolve, 12000));
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleClickCamera = (e) => {
    if (e) e.stopPropagation();
    cameraInputRef.current?.click();
  };

  const clearUploads = () => setUploads([]);

  return (
    <div>
      <input 
        type="file" 
        accept="image/*,application/pdf" 
        multiple
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={cameraInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />

      {/* BOTÓN PRINCIPAL DE CÁMARA MÓVIL (CTA GIGANTE EN MÓVIL) */}
      <div 
        onClick={handleClickCamera}
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
          color: '#fff',
          borderRadius: 18,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          cursor: 'pointer',
          boxShadow: '0 8px 20px rgba(181, 138, 48, 0.35)',
          marginBottom: 16
        }}
      >
        <Camera size={26} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.3px' }}>📸 Sacar Foto al Albarán con la Cámara</div>
          <div style={{ fontSize: 11.5, opacity: 0.9, fontWeight: 600, marginTop: 1 }}>Compresión instantánea + Lectura por IA Gemini</div>
        </div>
      </div>

      {/* ÁREA DE CARGA & DRAG AND DROP */}
      <div 
        onClick={handleClickUpload}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ 
          background: isDragging ? 'var(--accentSoft)' : 'var(--surface)', 
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`, 
          borderRadius: 20, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 20 
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accentSoft)', margin: '0 auto 12px', border: '1px solid rgba(214, 168, 72, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <FileUp size={22} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 4 }}>O selecciona un archivo / PDF existente</div>
        <div style={{ fontSize: 12, color: 'var(--textSoft)', fontWeight: 500 }}>Acepta formatos JPG, PNG o PDF.</div>
      </div>

      {/* MODAL / TARJETA DE VISTA PREVIA TRAS LA CÁMARA */}
      {previewUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: 16
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: 460, borderRadius: 24,
            border: '1px solid var(--border)', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>Revisar Foto del Albarán</div>
                <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>Comprueba que los datos y totales sean legibles</div>
              </div>
              <button onClick={handleCancelPreview} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer', padding: 4 }}>
                <X size={22} />
              </button>
            </div>

            {/* Previsualizador de foto rotada */}
            <div style={{
              width: '100%', height: 320, background: '#0f172a', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative'
            }}>
              <img 
                src={previewUrl} 
                alt="Vista previa albarán"
                style={{
                  maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                  transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease'
                }} 
              />
            </div>

            {/* Botones de acción táctiles grandes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={handleRotate}
                style={{
                  padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <RotateCw size={16} /> Girar 90° ({rotation}°)
              </button>

              <button
                onClick={handleClickCamera}
                style={{
                  padding: '12px', borderRadius: 12, border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                <RefreshCw size={16} /> Repetir Foto
              </button>
            </div>

            <button
              onClick={handleConfirmPreview}
              disabled={isCompressing}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
                color: '#fff', fontSize: 14.5, fontWeight: 800, cursor: isCompressing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(181, 138, 48, 0.4)'
              }}
            >
              {isCompressing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
              {isCompressing ? 'Comprimiendo imagen...' : '🚀 Procesar Albarán con IA'}
            </button>
          </div>
        </div>
      )}

      {/* LISTADO DE PROGRESO DE SUBIDA */}
      {uploads.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: '1px solid var(--bg)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>Progreso de subida ({uploads.filter(u=>u.status==='done').length}/{uploads.length})</div>
            <div onClick={clearUploads} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--textSoft)', cursor: 'pointer' }}>Limpiar lista</div>
          </div>
          
          <div style={{ padding: '0 10px' }}>
            {uploads.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px', borderBottom: '1px solid var(--bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {u.status === 'idle' && <div style={{width:8, height:8, borderRadius:'50%', background:'var(--border)'}}></div>}
                  {(u.status === 'uploading' || u.status === 'processing') && <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />}
                  {u.status === 'done' && <CheckCircle size={16} color="var(--success)" />}
                  {u.status === 'error' && <AlertTriangle size={16} color="var(--danger)" />}
                  
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: u.status === 'error' ? 'var(--danger)' : 'inherit' }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>
                      {u.status === 'idle' && 'En cola...'}
                      {u.status === 'waiting_rate_limit' && 'Pausado 12s (Evitando límite de IA)...'}
                      {u.status === 'uploading' && 'Subiendo foto optimizada a Supabase...'}
                      {u.status === 'processing' && 'Extrayendo albarán con Gemini IA...'}
                      {u.status === 'done' && `Guardado: ${u.data?.proveedor} - €${u.data?.importeTotal}`}
                      {u.status === 'error' && `Error: ${u.errorMsg}`}
                    </div>
                  </div>
                </div>
                
                {u.status === 'done' && (
                  <div 
                    onClick={() => {
                      if (u.data?.dbId) {
                        setSelectedId(u.data.dbId);
                        setView('detalle');
                      }
                    }}
                    style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer', padding: '6px 12px', background: 'var(--accentSoft)', borderRadius: 8 }}
                  >
                    Ver extraído →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
