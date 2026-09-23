import React, { useState, useMemo } from 'react';
import { getInitials, getAvatarBg, getStatusMeta } from '../data';
import { 
  ArrowUpRight, ArrowDownRight, ChevronRight, CheckCircle2, AlertTriangle, 
  Eye, UploadCloud, Download, Loader2, TrendingUp, ChefHat, Package, 
  FileText, QrCode, ShieldAlert, Sparkles, AlertCircle, ArrowRight, DollarSign,
  Bot, Camera
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { detectarAlertasMargen } from '../utils/marginAlerts';
import { calcularCierreCaja } from '../utils/cierreCaja';

export default function DashboardView({ 
  isAdmin, 
  setView, 
  setSelectedId, 
  setSelectedPlatoId,
  setAlbaranesFilter, 
  albaranesData = [], 
  allAlbaranes = [], 
  proveedoresData = [], 
  localesData = [],
  platosData = []
}) {
  const [exporting, setExporting] = useState(false);
  const [ventasDiaInput, setVentasDiaInput] = useState('2100');

  const cierreCalculado = useMemo(() => {
    return calcularCierreCaja({ ventasBrutas: ventasDiaInput, platos: platosData });
  }, [ventasDiaInput, platosData]);

  // --- CÁLCULO DE MÉTRICAS DERIVADAS (REALES & VIVAS) ---
  const totalAlbaranes = albaranesData.length;
  const totalGastoNum = albaranesData.reduce((s, a) => s + (parseFloat(a.importe) || 0), 0);
  const totalGastoStr = totalGastoNum.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  // Incidencias en albaranes
  const albaranesConIncidencia = albaranesData.filter(a => a.estado === 'incidencia');
  const totalIncidencias = albaranesData.reduce((s, a) => s + (a.items ? a.items.filter(i => i.flag).length : 0), 0);
  const incidenciasPrecio = albaranesData.reduce((s, a) => s + (a.items ? a.items.filter(i => i.flag && i.motivo?.toLowerCase().includes('precio')).length : 0), 0);
  const incidenciasCantidad = albaranesData.reduce((s, a) => s + (a.items ? a.items.filter(i => i.flag && !i.motivo?.toLowerCase().includes('precio')).length : 0), 0);

  // Carta & Escandallos
  const platosConEscandallo = platosData.filter(p => p.coste > 0);
  const sumaMargenPct = platosConEscandallo.reduce((s, p) => s + (p.margenPct || 0), 0);
  const margenMedioPct = platosConEscandallo.length > 0 ? (sumaMargenPct / platosConEscandallo.length) : 0;
  
  // Alertas dinámicas de Food Cost e Ingredientes
  const alertasMargenDinamicas = useMemo(() => {
    return detectarAlertasMargen(platosData, [], 65);
  }, [platosData]);

  const platosEnRiesgo = useMemo(() => {
    return platosData.filter(p => p.hasAlert || (p.coste > 0 && p.margenPct < 65) || alertasMargenDinamicas.some(a => a.platoId === p.id));
  }, [platosData, alertasMargenDinamicas]);

  const platosEstrella = [...platosConEscandallo].sort((a, b) => b.margenPct - a.margenPct).slice(0, 3);
  const platosAjustar = [...platosConEscandallo].sort((a, b) => a.margenPct - b.margenPct).slice(0, 3);

  // Proveedores top
  const maxGastoProv = Math.max(...proveedoresData.map(p => parseFloat(p.importeTotal) || 0), 1);
  const proveedoresSorted = [...proveedoresData].sort((a, b) => (parseFloat(b.importeTotal) || 0) - (parseFloat(a.importeTotal) || 0));

  // Exportar Gestoría (ZIP + Excel + Imágenes)
  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const wb = XLSX.utils.book_new();
      
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
      
      const provData = proveedoresData.map(p => ({
        Nombre: p.nombre,
        Total_Albaranes: p.numAlbaranes,
        Gasto_Total: p.importeTotal,
        Incidencias_Pct: p.incidenciasPct
      }));
      const wsProv = XLSX.utils.json_to_sheet(provData);
      XLSX.utils.book_append_sheet(wb, wsProv, 'Proveedores');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file("Cierre_Contable.xlsx", excelBuffer);

      const imgFolder = zip.folder("Facturas_Originales");
      for (const alb of albaranesData) {
        if (alb.imagenUrl) {
          try {
            const response = await fetch(alb.imagenUrl);
            const blob = await response.blob();
            let ext = alb.imagenUrl.split('.').pop().split('?')[0];
            if (ext.length > 4) ext = 'jpg';
            const safeName = `${alb.proveedor.replace(/[^a-z0-9]/gi, '_')}_${alb.numero}.${ext}`;
            imgFolder.file(safeName, blob);
          } catch (e) {
            console.error("Error bajando imagen", alb.imagenUrl);
          }
        }
      }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 1. RESUMEN EJECUTIVO CHEFBOT IA & BOTÓN GIGANTE FOTO ALBARÁN */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #0F172A 60%, #1E293B 100%)',
        borderRadius: 20,
        padding: '24px 28px',
        color: '#fff',
        boxShadow: '0 12px 30px rgba(30, 27, 75, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: '1 1 400px' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(214, 168, 72, 0.4)',
            flexShrink: 0
          }}>
            <Bot size={30} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                Resumen Ejecutivo ChefBot IA
              </span>
              <span style={{
                background: 'rgba(214, 168, 72, 0.2)',
                color: 'var(--accent)',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid rgba(214, 168, 72, 0.4)',
                textTransform: 'uppercase'
              }}>
                En Vivo
              </span>
            </div>
            <div style={{ fontSize: 13.5, color: '#CBD5E1', marginTop: 6, lineHeight: 1.4, fontWeight: 500 }}>
              {albaranesConIncidencia.length > 0 || platosEnRiesgo.length > 0 ? (
                <>
                  {albaranesConIncidencia.length > 0 && <span>⚠️ Detectadas <strong>{albaranesConIncidencia.length} discrepancias</strong> en facturas de proveedores. </span>}
                  {platosEnRiesgo.length > 0 && <span>🍽️ Hay <strong>{platosEnRiesgo.length} platos</strong> con margen vulnerable.</span>}
                </>
              ) : (
                <span>✨ <strong>Todo bajo control hoy.</strong> Compras sin sobrecostes detectados y rentabilidad media de carta en un sólido <strong>{margenMedioPct.toFixed(1)}%</strong>.</span>
              )}
            </div>
          </div>
        </div>

        {/* MEGA BOTÓN CTA FOTO ALBARÁN EN 3 SEGUNDOS */}
        <button
          onClick={() => setView('subir')}
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accentDeep) 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '16px 28px',
            fontSize: 15,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 8px 24px rgba(214, 168, 72, 0.4)',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Camera size={24} />
          <div style={{ textAlign: 'left' }}>
            <div>Digitalizar Albarán en 3s</div>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>Cámara o Foto con OCR IA</div>
          </div>
        </button>
      </div>

      {/* WIDGET DESTACADO: CALCULADORA EXPRESS DE CIERRE DE CAJA */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        borderRadius: 20,
        padding: 24,
        color: '#fff',
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <DollarSign size={22} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>Calculadora Express de Cierre de Caja</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Calcula tu margen limpio y Food Cost estimado de hoy al instante</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.06)', padding: '6px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Ventas del día:</span>
            <input
              type="number"
              value={ventasDiaInput}
              onChange={(e) => setVentasDiaInput(e.target.value)}
              placeholder="Ej: 2100"
              style={{
                width: 100, padding: '6px 10px', borderRadius: 8,
                background: '#0F172A', border: '1px solid var(--accent)',
                color: '#fff', fontSize: 14, fontWeight: 800, outline: 'none'
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>€</span>
          </div>
        </div>

        {cierreCalculado.ventasBrutas > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14,
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Ventas Brutas</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 2 }}>€{cierreCalculado.ventasBrutas.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Coste Materia Prima ({cierreCalculado.foodCostPct}%)</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#F87171', marginTop: 2 }}>-€{cierreCalculado.costeMateriaPrima.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.12)', borderRadius: 12, padding: 14, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34D399', textTransform: 'uppercase' }}>Margen Limpio del Día ({cierreCalculado.margenPct}%)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', marginTop: 2 }}>+€{cierreCalculado.margenEuros.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        )}

        <div style={{
          fontSize: 12.5, color: '#E2E8F0', background: 'rgba(214, 168, 72, 0.12)',
          borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(214, 168, 72, 0.25)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <Sparkles size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span>{cierreCalculado.insight}</span>
        </div>
      </div>

      {/* 2. ACCIONES RÁPIDAS (SHORTCUTS DEL GERENTE) */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Acciones Rápidas
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          
          <div 
            onClick={() => setView('subir')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accentSoft)', color: 'var(--accentDeep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Subir Albarán</div>
              <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Digitalizar con foto / OCR</div>
            </div>
          </div>

          <div 
            onClick={() => setView('pedidos')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--whatsapp)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37, 211, 102, 0.12)', color: 'var(--whatsapp)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Pedido Sugerido</div>
              <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>1-Click vía WhatsApp</div>
            </div>
          </div>

          <div 
            onClick={() => setView('facturas_conciliacion')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Caza-Trampas</div>
              <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Conciliar facturas al mes</div>
            </div>
          </div>

          <div 
            onClick={() => setView('carta_qr')}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(168, 85, 247, 0.1)', color: '#A855F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>Carta QR</div>
              <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Imprimir peanas de mesa</div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: exporting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(181, 138, 48, 0.25)',
              textAlign: 'left',
              outline: 'none'
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {exporting ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={20} />}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{exporting ? 'Generando...' : 'Gestoría (ZIP)'}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Excel + Imágenes OCR</div>
            </div>
          </button>

        </div>
      </div>

      {/* 3. SEMÁFORO DEL NEGOCIO (2 BLOQUES GIGANTES DE CONTROL EJECUTIVO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        
        {/* BLOQUE 1: COMPRAS Y FACTURAS */}
        <div style={{
          background: totalIncidencias > 0 ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #FFF 100%)',
          border: `2px solid ${totalIncidencias > 0 ? '#FCA5A5' : '#86EFAC'}`,
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: totalIncidencias > 0 ? '#FEE2E2' : '#DCFCE7',
                  color: totalIncidencias > 0 ? '#DC2626' : '#16A34A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {totalIncidencias > 0 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: totalIncidencias > 0 ? '#991B1B' : '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Salud de Compras y Facturas
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                    {totalIncidencias > 0 ? `${totalIncidencias} Sobrecostes Detectados` : 'Compras Limpias Sin Incidencias'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700 }}>GASTO MES ACUMULADO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>€{totalGastoStr}</div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>{totalAlbaranes} albaranes procesados</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700 }}>INCIDENCIAS DE PRECIO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: totalIncidencias > 0 ? '#DC2626' : '#16A34A' }}>
                  {totalIncidencias}
                </div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>{incidenciasPrecio} precio · {incidenciasCantidad} cantidad</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (setAlbaranesFilter) setAlbaranesFilter(totalIncidencias > 0 ? 'Incidencias' : 'Todos');
              setView('albaranes');
            }}
            style={{
              width: '100%',
              background: totalIncidencias > 0 ? '#DC2626' : 'var(--surface)',
              color: totalIncidencias > 0 ? '#fff' : 'var(--text)',
              border: totalIncidencias > 0 ? 'none' : '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {totalIncidencias > 0 ? '🚨 Reclamar Incidencias de Compras' : 'Ver Todos los Albaranes'} <ArrowRight size={16} />
          </button>
        </div>

        {/* BLOQUE 2: RENTABILIDAD Y CARTA */}
        <div style={{
          background: platosEnRiesgo.length > 0 ? 'linear-gradient(135deg, #FFFBEB 0%, #FFF 100%)' : 'linear-gradient(135deg, #F0FDF4 0%, #FFF 100%)',
          border: `2px solid ${platosEnRiesgo.length > 0 ? '#FDE68A' : '#86EFAC'}`,
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: platosEnRiesgo.length > 0 ? '#FEF3C7' : '#DCFCE7',
                  color: platosEnRiesgo.length > 0 ? '#D97706' : '#16A34A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {platosEnRiesgo.length > 0 ? <ShieldAlert size={24} /> : <ChefHat size={24} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: platosEnRiesgo.length > 0 ? '#B45309' : '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Rentabilidad & Margen Carta
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                    {platosEnRiesgo.length > 0 ? `${platosEnRiesgo.length} Platos en Alerta de Margen` : 'Carta Altamente Rentable'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18, background: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 12, border: '1px solid rgba(0,0,0,0.05)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700 }}>MARGEN BRUTO MEDIO</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: margenMedioPct >= 70 ? '#16A34A' : '#D97706' }}>
                  {margenMedioPct.toFixed(1)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Objetivo recomendado ≥ 70%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)', fontWeight: 700 }}>PLATOS VULNERABLES</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: platosEnRiesgo.length > 0 ? '#D97706' : '#16A34A' }}>
                  {platosEnRiesgo.length}
                </div>
                <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Margen &lt; 65% o alza de coste</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setView('platos')}
            style={{
              width: '100%',
              background: platosEnRiesgo.length > 0 ? '#D97706' : 'var(--surface)',
              color: platosEnRiesgo.length > 0 ? '#fff' : 'var(--text)',
              border: platosEnRiesgo.length > 0 ? 'none' : '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {platosEnRiesgo.length > 0 ? '🍽️ Revisar Escandallos en Riesgo' : 'Ver Todos los Escandallos'} <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* 4. BLOQUE CENTRAL: TOP PROVEEDORES & SALUD DE LA CARTA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'stretch' }}>
        
        {/* TOP PROVEEDORES POR GASTO */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Top Compras por Proveedor</div>
            <button 
              onClick={() => setView('proveedores')} 
              style={{ background: 'none', border: 'none', color: 'var(--accentDeep)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {proveedoresSorted.slice(0, 5).map((p, i) => {
              const impNum = parseFloat(p.importeTotal) || 0;
              const pctOfMax = Math.round((impNum / maxGastoProv) * 100);
              const pctOfTotal = totalGastoNum > 0 ? Math.round((impNum / totalGastoNum) * 100) : 0;

              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                      <span style={{ fontSize: 11, color: 'var(--textSoft)', width: 14 }}>#{i + 1}</span>
                      {p.nombre}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 11.5, color: 'var(--textSoft)', fontWeight: 600 }}>{pctOfTotal}% del total</span>
                      <span style={{ fontWeight: 800, color: 'var(--text)' }}>€{impNum.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: 'var(--bg)', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      borderRadius: 6, 
                      background: 'linear-gradient(90deg, var(--accent), var(--accentDeep))', 
                      width: `${pctOfMax}%`,
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SALUD DE LA CARTA Y ESCANDALLOS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Salud Económica de la Carta</div>
            <button 
              onClick={() => setView('platos')} 
              style={{ background: 'none', border: 'none', color: 'var(--accentDeep)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Ver Escandallos <ChevronRight size={14} />
            </button>
          </div>

          {/* Platos Estrella vs Platos a Revisar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> Platos Más Rentables
            </div>

            {platosEstrella.map(plato => (
              <div 
                key={plato.id} 
                onClick={() => { if (setSelectedPlatoId) setSelectedPlatoId(plato.id); setView('receta'); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--successSoft)', borderRadius: 10, cursor: 'pointer' }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{plato.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Coste: €{plato.coste?.toFixed(2)} | PVP: €{plato.precioVenta?.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--success)' }}>{plato.margenPct?.toFixed(1)}%</span>
                  <div style={{ fontSize: 10, color: 'var(--textSoft)' }}>margen bruto</div>
                </div>
              </div>
            ))}

            {platosAjustar.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} /> Sugerencias de Ajuste de PVP
                </div>

                {platosAjustar.map(plato => (
                  <div 
                    key={plato.id} 
                    onClick={() => { if (setSelectedPlatoId) setSelectedPlatoId(plato.id); setView('receta'); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--warningSoft)', borderRadius: 10, cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{plato.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--textSoft)' }}>Actual: €{plato.precioVenta?.toFixed(2)} → <strong style={{ color: 'var(--text)' }}>Rec: €{plato.pvpRecomendado?.toFixed(2)}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--warning)' }}>{plato.margenPct?.toFixed(1)}%</span>
                      <div style={{ fontSize: 10, color: 'var(--textSoft)' }}>margen actual</div>
                    </div>
                  </div>
                ))}
              </>
            )}

          </div>
        </div>

      </div>

      {/* 5. MULTI-LOCAL CADENA (SI IS ADMIN) */}
      {isAdmin && localesData.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Control Cadena de Restaurantes</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', fontSize: 11, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 8px 10px', borderBottom: '1px solid var(--border)' }}>
            <div>Restaurante / Local</div><div>Albaranes</div><div>Gasto Mes</div><div>Incidencias</div>
          </div>

          {localesData.map((l, i) => {
            const albsSource = allAlbaranes.length > 0 ? allAlbaranes : albaranesData;
            const albsDelLocal = albsSource.filter(a => a.restaurante_id === l.id);
            const numAlbs = albsDelLocal.length;
            const gastoLocal = albsDelLocal.reduce((s, a) => s + (parseFloat(a.importe) || 0), 0).toFixed(2);
            const incidsLocal = albsDelLocal.reduce((s, a) => s + (a.items ? a.items.filter(item => item.flag).length : 0), 0);

            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', alignItems: 'center', padding: '14px 8px', borderBottom: '1px solid var(--border)', fontSize: 13.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: getAvatarBg(l.nombre), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                    {getInitials(l.nombre)}
                  </div>
                  {l.nombre}
                </div>
                <div style={{ fontWeight: 600 }}>{numAlbs} albaranes</div>
                <div style={{ fontWeight: 800 }}>€{parseFloat(gastoLocal).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
                <div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    fontWeight: 800,
                    background: incidsLocal > 0 ? 'var(--dangerSoft)' : 'var(--successSoft)',
                    color: incidsLocal > 0 ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {incidsLocal} detectadas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. ACTIVIDAD RECIENTE (TABLA DE ALBARANES RECIENTES) */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>Últimos Albaranes Recibidos</div>
          <button 
            onClick={() => setView('albaranes')} 
            style={{ background: 'none', border: 'none', color: 'var(--accentDeep)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Ver histórico completo <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 40px', fontSize: 11, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', padding: '0 8px 10px', borderBottom: '1px solid var(--border)' }}>
          <div>Nº Albarán</div><div>Proveedor</div><div>Fecha</div><div>Importe</div><div>Estado</div><div></div>
        </div>

        {albaranesData.slice(0, 5).map(a => {
          const m = getStatusMeta(a.estado);
          return (
            <div
              key={a.id}
              onClick={() => { setSelectedId(a.id); setView('detalle'); }}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr 1fr 40px', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--bg)', cursor: 'pointer', fontSize: 13.5, borderRadius: 8, transition: 'background 0.15s ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 700, color: 'var(--accentDeep)' }}>{a.numero}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: getAvatarBg(a.proveedor), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                  {getInitials(a.proveedor)}
                </div>
                <span style={{ fontWeight: 600 }}>{a.proveedor}</span>
              </div>
              <div style={{ color: 'var(--textSoft)', fontWeight: 500 }}>{a.fecha}</div>
              <div style={{ fontWeight: 800 }}>€{parseFloat(a.importe).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
              <div>
                <span style={{ color: m.color, background: m.bg, padding: '4px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
                  {m.label}
                </span>
              </div>
              <div style={{ color: 'var(--textSoft)', display: 'flex', justifyContent: 'flex-end' }}>
                <Eye size={16} />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
