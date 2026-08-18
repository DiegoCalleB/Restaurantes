import React, { useState } from 'react';
import { getInitials, getAvatarBg, getStatusMeta } from '../data';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal, ChevronRight, CheckCircle2, AlertTriangle, Loader, Eye, UploadCloud, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function DashboardView({ isAdmin, setView, setSelectedId, setAlbaranesFilter, albaranesData = [], proveedoresData = [], localesData = [] }) {
  const totalAlbaranes = isAdmin ? localesData.reduce((s,l)=>s+l.albaranes,0) : albaranesData.length;
  const totalGasto = isAdmin ? localesData.reduce((s,l)=>s+parseFloat(l.gasto),0).toFixed(2) : albaranesData.reduce((s,a) => s + parseFloat(a.importe), 0).toFixed(2);
  const totalIncidencias = isAdmin ? localesData.reduce((s,l)=>s+l.incidencias,0) : albaranesData.reduce((s,a) => s + (a.items ? a.items.filter(i=>i.flag).length : 0), 0);

  // Calcular tipos de incidencias reales
  const incidenciasPrecio = albaranesData.reduce((s, a) => s + (a.items ? a.items.filter(i => i.flag && i.motivo?.toLowerCase().includes('precio')).length : 0), 0);
  const incidenciasCantidad = albaranesData.reduce((s, a) => s + (a.items ? a.items.filter(i => i.flag && !i.motivo?.toLowerCase().includes('precio')).length : 0), 0);

  const kpis = [
    { label:'Albaranes (mes)', value: totalAlbaranes, trend:'▲ 8% vs mes anterior', trendColor:'var(--success)', dot:'var(--accent)' },
    { label:'Gasto total (mes)', value:'€'+totalGasto, trend:'▲ 4,1% vs mes anterior', trendColor:'var(--success)', dot:'var(--accentDeep)' },
    { label:'Incidencias detectadas', value:totalIncidencias, trend:'▼ 2 menos que el mes pasado', trendColor:'var(--success)', dot:'var(--danger)' },
    { label:'Proveedores activos', value: proveedoresData.length, trend:'sin cambios', trendColor:'var(--textSoft)', dot:'var(--success)' },
  ];

  const maxGasto = Math.max(...proveedoresData.map(p => parseFloat(p.importeTotal)));
  
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      
      // 1. Crear el Excel
      const wb = XLSX.utils.book_new();
      
      // Pestaña Albaranes
      const albData = albaranesData.map(a => ({
        Numero: a.numero,
        Proveedor: a.proveedor,
        Fecha: a.fecha,
        Base_Imponible: a.baseImponible,
        Importe_Total: a.importe,
        Estado: a.estado,
        URL_Imagen: a.imagenUrl
      }));
      const wsAlbaranes = XLSX.utils.json_to_sheet(albData);
      XLSX.utils.book_append_sheet(wb, wsAlbaranes, 'Albaranes');
      
      // Pestaña Proveedores
      const provData = proveedoresData.map(p => ({
        Nombre: p.nombre,
        Total_Albaranes: p.numAlbaranes,
        Gasto_Total: p.importeTotal,
        Incidencias_Pct: p.incidenciasPct
      }));
      const wsProv = XLSX.utils.json_to_sheet(provData);
      XLSX.utils.book_append_sheet(wb, wsProv, 'Proveedores');

      // Generar buffer del Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file("Cierre_Contable.xlsx", excelBuffer);

      // 2. Descargar las imágenes de los albaranes y meterlas en el ZIP
      const imgFolder = zip.folder("Facturas_Originales");
      for (const alb of albaranesData) {
        if (alb.imagenUrl) {
          try {
            const response = await fetch(alb.imagenUrl);
            const blob = await response.blob();
            // Limpiar nombre de archivo (quitar query params de supabase si hay)
            let ext = alb.imagenUrl.split('.').pop().split('?')[0];
            if (ext.length > 4) ext = 'jpg';
            const safeName = `${alb.proveedor.replace(/[^a-z0-9]/gi, '_')}_${alb.numero}.${ext}`;
            imgFolder.file(safeName, blob);
          } catch (e) {
            console.error("Error bajando imagen", alb.imagenUrl);
          }
        }
      }

      // 3. Generar y descargar el ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `Cierre_Gestoria_${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}.zip`);
      
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Hubo un error al generar la exportación.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button 
          onClick={handleExport}
          disabled={exporting}
          style={{ background: 'var(--accentDeep)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(44, 85, 128, 0.3)' }}
        >
          {exporting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
          {exporting ? 'Generando ZIP...' : 'Exportar para Gestoría (ZIP)'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: k.dot }}></div>
              <div style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k.label}</div>
            </div>
            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.5px' }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: k.trendColor }}>{k.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginBottom: 14, alignItems: 'stretch' }}>
        {/* Gasto por proveedor */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 18 }}>Gasto por proveedor · este mes</div>
          {proveedoresData.slice(0,4).map((p, i) => {
            const pct = Math.round(parseFloat(p.importeTotal) / maxGasto * 100);
            return (
              <div key={i} style={{ marginBottom: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>{p.nombre}</span>
                  <span style={{ color: 'var(--textSoft)', fontWeight: 600 }}>€{p.importeTotal}</span>
                </div>
                <div style={{ height: 9, borderRadius: 6, background: 'var(--bg)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, background: 'linear-gradient(90deg, var(--accentLight), var(--accent))', width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tipos incidencia */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 2px rgba(20,15,10,0.03)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 18 }}>Incidencias por tipo (Datos reales)</div>
          
          <div 
            onClick={() => {
              if (setAlbaranesFilter) setAlbaranesFilter('Incidencias');
              setView('albaranes');
            }}
            style={{ height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 18, cursor: 'pointer' }}
            title="Haz clic para ver todos los albaranes con incidencias"
          >
            <div style={{ height: '100%', background: 'var(--danger)', width: `${(incidenciasPrecio / Math.max(1, totalIncidencias)) * 100}%` }}></div>
            <div style={{ height: '100%', background: 'var(--warning)', width: `${(incidenciasCantidad / Math.max(1, totalIncidencias)) * 100}%` }}></div>
          </div>
          
          <div 
            onClick={() => {
              if (setAlbaranesFilter) setAlbaranesFilter('Incidencias');
              setView('albaranes');
            }}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid var(--bg)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><div style={{ width:7, height:7, background:'var(--danger)' }}></div><span style={{ fontSize:13, fontWeight:600 }}>Diferencia precio</span></div>
            <span style={{ fontWeight:800, fontSize:13 }}>{incidenciasPrecio}</span>
          </div>
          
          <div 
            onClick={() => {
              if (setAlbaranesFilter) setAlbaranesFilter('Incidencias');
              setView('albaranes');
            }}
            style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid var(--bg)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><div style={{ width:7, height:7, background:'var(--warning)' }}></div><span style={{ fontSize:13, fontWeight:600 }}>Cantidad u otros</span></div>
            <span style={{ fontWeight:800, fontSize:13 }}>{incidenciasCantidad}</span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 14 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>Locales de la cadena</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 4px 10px' }}>
            <div>Local</div><div>Albaranes</div><div>Gasto mes</div><div>Incidencias</div>
          </div>
          {localesData.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 4px', borderTop: '1px solid var(--bg)', fontSize: 13.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: getAvatarBg(l.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{getInitials(l.nombre)}</div>
                {l.nombre}
              </div>
              <div>{l.albaranes}</div>
              <div>€{l.gasto}</div>
              <div style={{ fontWeight:800, color: l.incidencias>=6 ? 'var(--danger)' : 'var(--success)' }}>{l.incidencias}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recientes */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 16 }}>Actividad reciente</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr', fontSize: 11, fontWeight: 700, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 4px 10px' }}>
          <div>Nº albarán</div><div>Proveedor</div><div>Fecha</div><div>Importe</div><div>Estado</div>
        </div>
        {albaranesData.slice(0,5).map(a => {
          const m = getStatusMeta(a.estado);
          return (
            <div 
              key={a.id} 
              onClick={() => { setSelectedId(a.id); setView('detalle'); }}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr', alignItems: 'center', padding: '12px 8px', borderTop: '1px solid var(--bg)', cursor: 'pointer', fontSize: 13.5, borderRadius: 10 }}
            >
              <div style={{ fontWeight: 700 }}>{a.numero}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: getAvatarBg(a.proveedor), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5 }}>{getInitials(a.proveedor)}</div>
                {a.proveedor}
              </div>
              <div style={{ color: 'var(--textSoft)', fontWeight: 500 }}>{a.fecha}</div>
              <div style={{ fontWeight: 600 }}>€{a.importe}</div>
              <div><span style={{ color: m.color, background: m.bg, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{m.label}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
