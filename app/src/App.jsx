import React, { useState } from 'react';
import { LayoutDashboard, FileText, UploadCloud, Users, ChevronRight, Loader2, Bot, Package, Menu, X, ChefHat, LogOut, Megaphone } from 'lucide-react';
import './index.css';
import { useAppData } from './useAppData';

// Vistas que vamos a implementar
import DashboardView from './views/DashboardView';
import AlbaranesView from './views/AlbaranesView';
import SubirView from './views/SubirView';
import ProveedoresView from './views/ProveedoresView';
import DetalleView from './views/DetalleView';
import PlatosView from './views/PlatosView';
import RecetaView from './views/RecetaView';
import PedidosView from './views/PedidosView';
import ChefBotView from './views/ChefBotView';
import NuevoEscandalloView from './views/NuevoEscandalloView';
import PromocionView from './views/PromocionView';
import LoginView from './views/LoginView';
import SubirCartaView from './views/SubirCartaView';

function App() {
  const [currentUser, setCurrentUser] = useState({ username: 'EmilioGallego', role: 'admin' });
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedPlatoId, setSelectedPlatoId] = useState(null);
  const [selectedRestauranteId, setSelectedRestauranteId] = useState('68d0128c-d047-48d4-8cbe-08fe151aa632');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [albaranesFilter, setAlbaranesFilter] = useState('Todos');
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { albaranes, proveedores, restaurantes, platos, pedidos, ingredientesBase, loading, errorMsg, refreshData, crearEscandallo, eliminarPlato, eliminarAlbaran } = useAppData();

  // Asegurar que un local esté seleccionado si restaurantes cambia
  React.useEffect(() => {
    if (restaurantes && restaurantes.length > 0) {
      const exists = restaurantes.some(r => r.id === selectedRestauranteId);
      if (!exists) {
        const tirso = restaurantes.find(r => r.nombre.toLowerCase().includes('tirso'));
        setSelectedRestauranteId(tirso ? tirso.id : restaurantes[0].id);
      }
    }
  }, [restaurantes]);

  const navItems = [
    { key: 'dashboard', label: 'Panel general', icon: <LayoutDashboard size={16} /> },
    { key: 'pedidos', label: 'Pedidos', icon: <Package size={16} /> },
    { key: 'albaranes', label: 'Albaranes', icon: <FileText size={16} /> },
    { key: 'subir', label: 'Subir albarán', icon: <UploadCloud size={16} /> },
    { key: 'proveedores', label: 'Proveedores', icon: <Users size={16} /> },
    { key: 'platos', label: 'Escandallos', icon: <FileText size={16} /> },
    { key: 'promocion', label: 'Promoción', icon: <Megaphone size={16} /> },
    { key: 'chefbot_widget', label: 'ChefBot (IA)', icon: <Bot size={16} /> },
  ];

  const titles = {
    dashboard: ['Panel general', 'Resumen de compras y control de albaranes'],
    pedidos: ['Control de Pedidos', 'Cruza lo que has pedido con lo que te facturan'],
    albaranes: ['Albaranes', 'Histórico de albaranes recibidos y su estado'],
    detalle: ['Revisión de albarán', 'Datos extraídos automáticamente por IA'],
    proveedores: ['Proveedores', 'Comparativa de precio, incidencias y puntualidad'],
    subir: ['Subir albarán', 'Digitaliza un nuevo albarán en segundos'],
    platos: ['Escandallos y Rentabilidad', 'Análisis en tiempo real de tus platos'],
    receta: ['Detalle del Escandallo', 'Desglose de costes de materia prima'],
    promocion: ['Promoción y Medios', 'Contacta con prensa y TV sin agencias'],
  };

  const [title, subtitle] = titles[view] || titles.dashboard;
  const isAdmin = true;

  // Filtrar los datos globales según el restaurante activo
  const activeAlbaranes = selectedRestauranteId === 'all' ? albaranes : albaranes.filter(a => a.restaurante_id === selectedRestauranteId);
  const activePedidos = selectedRestauranteId === 'all' ? pedidos : pedidos.filter(p => p.restaurante_id === selectedRestauranteId);
  const activePlatos = selectedRestauranteId === 'all' ? platos : platos.filter(p => p.restaurante_id === selectedRestauranteId);
  
  // Proveedores metrics recalculation based on active albaranes
  const activeProveedores = proveedores.map(p => {
    const albsDelProv = activeAlbaranes.filter(a => a.proveedor === p.nombre);
    const totalGastado = albsDelProv.reduce((sum, a) => sum + (parseFloat(a.importe) || 0), 0);
    const countIncidencias = albsDelProv.filter(a => a.estado === 'incidencia').length;
    return {
      ...p,
      numAlbaranes: albsDelProv.length,
      importeTotal: totalGastado.toFixed(2),
      incidenciasPct: albsDelProv.length ? Math.round((countIncidencias / albsDelProv.length) * 100) : 0
    };
  });

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  return (
    <div className="app-layout">
      {/* Botón de Menú Móvil */}
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* SIDEBAR */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 16px' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-1px', color: 'var(--accent)', fontFamily: 'serif' }}>silvestre</div>
            <div style={{ fontSize: 10, color: 'var(--sidebarSoft)', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: -2 }}>VINOS Y COMIDAS</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map(n => {
            const active = n.key === (view === 'detalle' ? 'albaranes' : view);
            return (
              <div 
                key={n.key}
                onClick={() => {
                  if (n.key === 'chefbot_widget') {
                    setIsChatOpen(true);
                  } else {
                    setView(n.key);
                  }
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', 
                  borderRadius: 11, cursor: 'pointer', 
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? '#fff' : 'var(--sidebarSoft)',
                  fontSize: 14, fontWeight: active ? 700 : 500
                }}
              >
                <div style={{
                  color: active ? 'var(--accentLight)' : 'rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center'
                }}>
                  {n.icon}
                </div>
                <span>{n.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{
          marginTop: 'auto', padding: 15, borderRadius: 14, 
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}></div>
            <div style={{ fontSize: 11.5, fontWeight: 700 }}>Conectado a Supabase</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--sidebarSoft)', lineHeight: 1.5 }}>
            Sincronización en tiempo real
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30, gap: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--textSoft)', marginTop: 5, fontWeight: 500 }}>{subtitle}</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--textSoft)' }}>Local:</span>
              <select 
                value={selectedRestauranteId}
                onChange={(e) => setSelectedRestauranteId(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
                  cursor: 'pointer', outline: 'none'
                }}
              >
                {restaurantes.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div 
              onClick={() => setCurrentUser(null)}
              title="Cerrar sesión"
              style={{
              width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700,
              boxShadow: '0 4px 10px -3px rgba(59, 110, 165, 0.5)',
              cursor: 'pointer'
            }}>
              {currentUser?.username.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Dynamic View Rendering */}
        {loading ? (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', color: 'var(--textSoft)', gap: 10 }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <div>Cargando datos desde Supabase...</div>
           </div>
        ) : errorMsg ? (
           <div style={{ padding: 20, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)', margin: '20px 0' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>❌ Error al conectar con Supabase</div>
              <div style={{ fontSize: 13 }}>{errorMsg}</div>
           </div>
        ) : (
          <>
            {view === 'dashboard' && <DashboardView isAdmin={isAdmin} setView={setView} setSelectedId={setSelectedId} setAlbaranesFilter={setAlbaranesFilter} albaranesData={activeAlbaranes} allAlbaranes={albaranes} proveedoresData={activeProveedores} localesData={restaurantes} />}
            {view === 'pedidos' && <PedidosView pedidos={activePedidos} proveedoresData={activeProveedores} />}
            { view === 'albaranes' && <AlbaranesView isAdmin={isAdmin} setView={setView} setSelectedId={setSelectedId} albaranesFilter={albaranesFilter} setAlbaranesFilter={setAlbaranesFilter} albaranesData={activeAlbaranes} eliminarAlbaran={eliminarAlbaran} /> }
            { view === 'detalle' && <DetalleView selectedId={selectedId} setView={setView} albaranesData={albaranes} eliminarAlbaran={eliminarAlbaran} /> }
            { view === 'proveedores' && <ProveedoresView isAdmin={isAdmin} proveedoresData={activeProveedores} /> }
            { view === 'subir' && <SubirView setView={setView} setSelectedId={setSelectedId} onUploadComplete={refreshData} /> }
            { view === 'platos' && <PlatosView platos={activePlatos} setView={setView} setSelectedPlatoId={setSelectedPlatoId} eliminarPlato={eliminarPlato} /> }
            { view === 'receta' && <RecetaView selectedPlatoId={selectedPlatoId} setView={setView} setSelectedId={setSelectedId} platos={activePlatos} eliminarPlato={eliminarPlato} /> }
            {view === 'nuevo_escandallo' && <NuevoEscandalloView setView={setView} ingredientesBase={ingredientesBase} crearEscandallo={crearEscandallo} />}
            {view === 'subir_carta' && <SubirCartaView setView={setView} selectedRestauranteId={selectedRestauranteId} onUploadComplete={refreshData} />}
            {view === 'promocion' && <PromocionView />}
          </>
        )}
      </main>

      {/* Persistent Widget para mantener la memoria del chatbot */}
      <ChefBotView 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextoDatos={{ albaranes: activeAlbaranes, proveedores: activeProveedores, platos: activePlatos }} 
        selectedRestauranteId={selectedRestauranteId} 
      />

      {/* Floating ChefBot Widget Button */}
      {!isChatOpen && (
        <div 
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px rgba(59, 110, 165, 0.4)',
            transition: 'transform 0.2s',
            zIndex: 1000
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Bot size={28} />
        </div>
      )}
    </div>
  );
}

export default App;
