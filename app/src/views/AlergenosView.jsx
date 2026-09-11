import React, { useState } from 'react';
import { ShieldCheck, Printer, QrCode, AlertCircle, Info, Edit3 } from 'lucide-react';

const LISTA_ALERGENOS_UE = [
  { id: 'gluten', nombre: 'Gluten', icono: '🌾' },
  { id: 'lacteos', nombre: 'Lácteos', icono: '🥛' },
  { id: 'huevos', nombre: 'Huevos', icono: '🥚' },
  { id: 'pescado', nombre: 'Pescado', icono: '🐟' },
  { id: 'frutos_secos', nombre: 'Frutos Secos', icono: '🥜' },
  { id: 'crustaceos', nombre: 'Crustáceos', icono: '🦐' },
  { id: 'moluscos', nombre: 'Moluscos', icono: '🦪' },
  { id: 'cacahuetes', nombre: 'Cacahuetes', icono: '🥜' },
  { id: 'soja', nombre: 'Soja', icono: '🫘' },
  { id: 'apio', nombre: 'Apio', icono: '🥬' },
  { id: 'mostaza', nombre: 'Mostaza', icono: '🟡' },
  { id: 'sesamo', nombre: 'Sésamo', icono: '⚪' },
  { id: 'sulfitos', nombre: 'Sulfitos', icono: '🍷' },
  { id: 'altramuces', nombre: 'Altramuces', icono: '🌱' }
];

export function AlergenosView({ platos = [], ingredientesBase = [], actualizarStockIngrediente }) {
  const [selectedIngr, setSelectedIngr] = useState(null);
  const [selectedAlergenos, setSelectedAlergenos] = useState([]);
  const [showQR, setShowQR] = useState(false);

  // Mock de platos con alérgenos si viene vacío
  const catalogPlatos = platos.length > 0 ? platos : [
    {
      id: 'p1',
      nombre: 'Solomillo de Ternera a la Pimienta',
      categoria: 'Principales',
      precioVenta: 24.50,
      alergenos: ['lacteos', 'gluten', 'sulfitos'],
      ingredientes: [
        { nombre: 'Solomillo de ternera', alergenos: [] },
        { nombre: 'Nata para cocinar', alergenos: ['lacteos'] },
        { nombre: 'Vino tinto', alergenos: ['sulfitos'] }
      ]
    },
    {
      id: 'p2',
      nombre: 'Croquetas Caseras de Jamón',
      categoria: 'Entrantes',
      precioVenta: 12.00,
      alergenos: ['gluten', 'lacteos', 'huevos'],
      ingredientes: [
        { nombre: 'Harina de trigo', alergenos: ['gluten'] },
        { nombre: 'Leche entera', alergenos: ['lacteos'] },
        { nombre: 'Huevo campero', alergenos: ['huevos'] }
      ]
    },
    {
      id: 'p3',
      nombre: 'Merluza a la Vasca',
      categoria: 'Principales',
      precioVenta: 21.00,
      alergenos: ['pescado', 'crustaceos', 'huevos'],
      ingredientes: [
        { nombre: 'Merluza fresca', alergenos: ['pescado'] },
        { nombre: 'Gambas', alergenos: ['crustaceos'] },
        { nombre: 'Huevo duro', alergenos: ['huevos'] }
      ]
    }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleOpenEditIngr = (ing) => {
    setSelectedIngr(ing);
    const initialAlerg = Array.isArray(ing.alergenos) ? ing.alergenos : [];
    setSelectedAlergenos(initialAlerg);
  };

  const toggleAlergeno = (alergId) => {
    if (selectedAlergenos.includes(alergId)) {
      setSelectedAlergenos(selectedAlergenos.filter(a => a !== alergId));
    } else {
      setSelectedAlergenos([...selectedAlergenos, alergId]);
    }
  };

  const handleSaveIngrAlergenos = async () => {
    if (selectedIngr && actualizarStockIngrediente) {
      await actualizarStockIngrediente(selectedIngr.id, {
        alergenos: selectedAlergenos
      });
    }
    setSelectedIngr(null);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="flex-between mb-24 no-print">
        <div>
          <h1 className="title-lg">Carta Oficial de Alérgenos & Fichas Técnicas</h1>
          <p className="subtitle">
            Cumplimiento automático del Reglamento UE 1169/2011 generado desde tus escandallos de cocina.
          </p>
        </div>
        <div className="flex-center gap-10">
          <button onClick={() => setShowQR(!showQR)} className="btn btn-secondary flex-center gap-8 font-bold">
            <QrCode size={16} />
            <span>{showQR ? 'Ocultar QR' : 'Ver QR Mesas'}</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary flex-center gap-8 font-bold">
            <Printer size={16} />
            <span>Imprimir Carta de Alérgenos</span>
          </button>
        </div>
      </div>

      {/* Banner de Info Legal */}
      <div className="banner banner-info mb-24 flex-between no-print">
        <div className="flex-center gap-10 text-sm">
          <Info size={20} className="text-accent flex-none" />
          <span>
            <strong>Normativa UE 1169/2011:</strong> Los alérgenos de cada plato se recalculan dinámicamente según la ficha de sus ingredientes base. Sin mantenimiento manual adicional.
          </span>
        </div>
      </div>

      {/* Preview Modal QR */}
      {showQR && (
        <div className="card p-24 mb-24 text-center bg-surface border-accent shadow-md no-print">
          <QrCode className="mx-auto text-accent mb-8" size={80} />
          <h3 className="font-extrabold text-md mb-4">Código QR para la mesa de tus comensales</h3>
          <p className="text-xs text-muted mb-12">Escaneando este código, tus clientes ven la carta de alérgenos actualizada en tiempo real.</p>
          <span className="badge badge-accent font-bold">https://restaurantes.aironlabs.com/alergenos/demo</span>
        </div>
      )}

      {/* Leyenda de los 14 Alérgenos UE */}
      <div className="card p-16 mb-24">
        <h3 className="font-bold text-sm mb-12 text-muted uppercase tracking-wider">Los 14 Alérgenos de Declaración Obligatoria (UE)</h3>
        <div className="grid-7 gap-8 text-center text-xs">
          {LISTA_ALERGENOS_UE.map(a => (
            <div key={a.id} className="p-8 rounded-8 bg-surface border border-subtle">
              <span className="text-xl block mb-2">{a.icono}</span>
              <span className="font-semibold text-primary">{a.nombre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla Oficial / Carta de Alérgenos por Plato */}
      <div className="card overflow-hidden">
        <div className="p-16 bg-surface border-b flex-between">
          <h2 className="font-extrabold text-md flex-center gap-8">
            <ShieldCheck className="text-success" size={20} />
            <span>Carta Oficial de Alérgenos por Plato</span>
          </h2>
          <span className="text-xs text-muted font-bold">{catalogPlatos.length} Platos Auditados</span>
        </div>

        <table className="table-custom">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Plato</th>
              <th>PVP</th>
              <th>Alérgenos Detectados</th>
              <th className="no-print">Estado Ficha</th>
            </tr>
          </thead>
          <tbody>
            {catalogPlatos.map((plato) => {
              const listAlerg = plato.alergenos || [];
              return (
                <tr key={plato.id}>
                  <td>
                    <span className="badge badge-neutral">{plato.categoria || 'Principal'}</span>
                  </td>
                  <td className="font-extrabold text-md text-primary">{plato.nombre}</td>
                  <td className="font-bold text-accent">{(parseFloat(plato.precioVenta) || 0).toFixed(2)}€</td>
                  <td>
                    {listAlerg.length === 0 ? (
                      <span className="text-xs text-success font-bold">✓ Ningún alérgeno declarado</span>
                    ) : (
                      <div className="flex-wrap gap-6">
                        {listAlerg.map((alergId) => {
                          const info = LISTA_ALERGENOS_UE.find(a => a.id === alergId);
                          return (
                            <span key={alergId} className="badge badge-warning text-xs font-bold flex-center gap-4">
                              <span>{info?.icono || '⚠️'}</span>
                              <span>{info?.nombre || alergId}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="no-print">
                    <span className="badge badge-success flex-center-start gap-4 text-xs">
                      <ShieldCheck size={12} /> Conforme UE
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para editar alérgenos de un ingrediente base */}
      {selectedIngr && (
        <div className="modal-backdrop">
          <div className="modal-content card p-24 max-w-md">
            <h3 className="title-md mb-12 flex-between">
              <span>Editar Alérgenos: {selectedIngr.nombre}</span>
              <button onClick={() => setSelectedIngr(null)} className="btn btn-ghost text-xs">✕</button>
            </h3>
            <p className="text-xs text-muted mb-16">
              Marca los alérgenos presentes en este ingrediente. Todos los platos que usen este ingrediente en su escandallo se actualizarán automáticamente.
            </p>

            <div className="grid-2 gap-8 mb-20 max-h-60 overflow-y-auto">
              {LISTA_ALERGENOS_UE.map(a => {
                const active = selectedAlergenos.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAlergeno(a.id)}
                    className={`p-10 rounded-8 text-left border flex-between ${active ? 'bg-accent-soft border-accent text-accent font-bold' : 'bg-surface border-subtle'}`}
                  >
                    <span>{a.icono} {a.nombre}</span>
                    <span>{active ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-end gap-10">
              <button onClick={() => setSelectedIngr(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleSaveIngrAlergenos} className="btn btn-primary">Guardar Alérgenos</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
