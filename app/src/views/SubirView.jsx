import React, { useState, useRef } from 'react';
import { FileUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { extraerDatosAlbaran } from '../geminiService';
import { subirArchivoBucket, guardarAlbaranExtraido } from '../supabaseClient';

export default function SubirView({ setView, setSelectedId }) {
  // Estado: un array de objetos con la info de cada archivo
  // { id, file, name, status: 'idle|uploading|processing|done|error', data, errorMsg }
  const [uploads, setUploads] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    
    // Procesar secuencialmente para evitar el error 429 (Límite de 5 peticiones/minuto en la capa gratuita)
    for (let i = 0; i < newUploads.length; i++) {
      const u = newUploads[i];
      await processFile(u);
      
      if (i < newUploads.length - 1) {
        // Marcar el siguiente como 'waiting' para que el usuario sepa que no se ha parado
        setUploads(prev => prev.map(up => up.id === newUploads[i+1].id ? { ...up, status: 'waiting_rate_limit' } : up));
        // Esperar 12 segundos entre peticiones (5 por minuto = 1 cada 12s)
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
    e.stopPropagation();
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

      <div 
        onClick={handleClickUpload}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ 
          background: isDragging ? 'var(--accentSoft)' : 'var(--surface)', 
          border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border)'}`, 
          borderRadius: 20, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 20 
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--accentSoft), rgba(59, 110, 165, 0.1))', margin: '0 auto 18px', border: '1px solid rgba(59, 110, 165, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
          <FileUp size={24} />
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 800, marginBottom: 7 }}>Haz clic aquí para subir archivos</div>
        <div style={{ fontSize: 13, color: 'var(--textSoft)', fontWeight: 500, marginBottom: 20 }}>Acepta formatos JPG, PNG o PDF.</div>
        
        <button 
          onClick={handleClickCamera}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)' }}
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
                  {(u.status === 'uploading' || u.status === 'processing') && <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />}
                  {u.status === 'done' && <CheckCircle size={16} color="var(--success)" />}
                  {u.status === 'error' && <AlertTriangle size={16} color="var(--danger)" />}
                  
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: u.status === 'error' ? 'var(--danger)' : 'inherit' }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>
                      {u.status === 'idle' && 'En cola...'}
                      {u.status === 'waiting_rate_limit' && 'Pausado 12s (Evitando límite de IA)...'}
                      {u.status === 'uploading' && 'Subiendo a Supabase Storage...'}
                      {u.status === 'processing' && 'Extrayendo datos con Gemini...'}
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
                    style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', cursor: 'pointer', padding: '4px 10px', background: 'var(--accentSoft)', borderRadius: 8 }}
                  >
                    Ver extraído
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
