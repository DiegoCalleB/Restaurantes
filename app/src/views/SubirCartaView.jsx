import React, { useState, useRef } from 'react';
import { FileUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { extraerDatosCarta } from '../geminiService';
import { guardarCartaExtraida } from '../supabaseClient';

export default function SubirCartaView({ setView, selectedRestauranteId, onUploadComplete }) {
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processFile = async (uploadObj) => {
    try {
      if (selectedRestauranteId === 'all') {
        throw new Error("Selecciona un restaurante específico arriba a la derecha antes de subir una carta.");
      }

      // 1. Marcar como processing AI
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'processing' } : u));
      const data = await extraerDatosCarta(uploadObj.file);
      
      // 2. Guardar en BD Supabase
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'saving' } : u));
      const resultado = await guardarCartaExtraida(data, selectedRestauranteId);
      
      // 3. Marcar como done
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'done', data: resultado } : u));
      
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error("Error en archivo", uploadObj.name, error);
      setUploads(prev => prev.map(u => u.id === uploadObj.id ? { ...u, status: 'error', errorMsg: error.message } : u));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
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
    for (const u of newUploads) {
      await processFile(u);
      // Esperar un poco entre peticiones
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  const clearUploads = () => setUploads([]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 5 }}>Importar Carta con IA</h2>
          <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>Sube una foto o PDF de la carta del restaurante seleccionado. La IA extraerá los platos y calculará un escandallo inicial.</p>
        </div>
        <button 
          onClick={() => setView('platos')}
          style={{
            background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
            padding: '10px 20px', borderRadius: 8, fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          Volver a Escandallos
        </button>
      </div>

      {selectedRestauranteId === 'all' && (
        <div style={{ background: 'var(--dangerSoft)', border: '1px solid var(--danger)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <AlertTriangle size={16} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--danger)', fontSize: 15 }}>Selecciona un restaurante</h4>
            <p style={{ margin: 0, color: 'var(--text)', fontSize: 13.5, lineHeight: 1.5 }}>
              Para poder guardar los platos, necesitas elegir un local específico en el menú desplegable de arriba a la derecha.
            </p>
          </div>
        </div>
      )}

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

      <div 
        onClick={selectedRestauranteId === 'all' ? undefined : handleClickUpload}
        onDragOver={selectedRestauranteId === 'all' ? undefined : onDragOver}
        onDragLeave={selectedRestauranteId === 'all' ? undefined : onDragLeave}
        onDrop={selectedRestauranteId === 'all' ? undefined : onDrop}
        style={{ 
          background: isDragging ? 'var(--accentSoft)' : 'var(--surface)', 
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`, 
          borderRadius: 20, padding: '40px 20px', textAlign: 'center', 
          cursor: selectedRestauranteId === 'all' ? 'not-allowed' : 'pointer', 
          transition: 'all 0.2s', marginBottom: 20,
          opacity: selectedRestauranteId === 'all' ? 0.5 : 1
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--accentSoft), rgba(59, 110, 165, 0.1))', margin: '0 auto 18px', border: '1px solid rgba(59, 110, 165, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <FileUp size={24} />
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 7 }}>Haz clic aquí para subir una carta (Menú)</div>
        <div style={{ fontSize: 13, color: 'var(--textSoft)', fontWeight: 500, marginBottom: 20 }}>Acepta formatos JPG, PNG o PDF.</div>
        
        <button 
          onClick={handleClickCamera}
          disabled={selectedRestauranteId === 'all'}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: selectedRestauranteId === 'all' ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)' }}
        >
          Abrir Cámara
        </button>
      </div>

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
                  {(u.status === 'processing' || u.status === 'saving') && <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />}
                  {u.status === 'done' && <CheckCircle size={16} color="var(--success)" />}
                  {u.status === 'error' && <AlertTriangle size={16} color="var(--danger)" />}
                  
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: u.status === 'error' ? 'var(--danger)' : 'inherit' }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>
                      {u.status === 'idle' && 'En cola...'}
                      {u.status === 'processing' && 'Analizando carta con Gemini e infiriendo ingredientes...'}
                      {u.status === 'saving' && 'Guardando platos en base de datos...'}
                      {u.status === 'done' && `¡Listo! ${u.data?.platosNuevos || 0} platos nuevos añadidos.`}
                      {u.status === 'error' && `Error: ${u.errorMsg}`}
                    </div>
                  </div>
                </div>
                
                {u.status === 'done' && (
                  <div 
                    onClick={() => setView('platos')}
                    style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accentSoft)', borderRadius: 8 }}
                  >
                    Ver Platos
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
