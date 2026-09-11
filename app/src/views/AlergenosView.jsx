import React, { useState } from 'react';
import { ShieldCheck, Printer, QrCode, Info } from 'lucide-react';
import { deducirCategoriaPlato } from '../utils/categoriaService';

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

function deducirAlergenos(texto) {
  if (!texto) return [];
  const t = texto.toLowerCase();
  const res = new Set();
  
  if (/pan|harina|trigo|tosta|brioche|cerveza|croqueta|pasta|ramen|masa|galleta|hamburguesa|bravas/.test(t)) res.add('gluten');
  if (/queso|leche|nata|mantequilla|crema|bechamel|yogur|huancaína|trufa/.test(t)) res.add('lacteos');
  if (/huevo|mayonesa|alioli|tortilla|ensaladilla/.test(t)) res.add('huevos');
  if (/pescado|sardina|merluza|bacalao|atun|bonito|salmon|anchoa|lubina|dorada/.test(t)) res.add('pescado');
  if (/gamba|langostino|marisco|gambon|cangrejo|cigala/.test(t)) res.add('crustaceos');
  if (/mejillon|almeja|pulpo|calamar|chipiron|ostra/.test(t)) res.add('moluscos');
  if (/almendra|nuez|avellana|piñon|romesco|pistacho|anacardo/.test(t)) res.add('frutos_secos');
  if (/cacahuete/.test(t)) res.add('cacahuetes');
  if (/soja|hoisin|edamame|tofu|teriyaki/.test(t)) res.add('soja');
  if (/apio/.test(t)) res.add('apio');
  if (/mostaza/.test(t)) res.add('mostaza');
  if (/sesamo|ajonjoli/.test(t)) res.add('sesamo');
  if (/vino|cava|sidra|vinagre/.test(t)) res.add('sulfitos');
  if (/altramuz/.test(t)) res.add('altramuces');

  return Array.from(res);
}


function evaluarDietaPlato(plato) {
  const textoCombinado = [
    plato.nombre,
    ...(plato.ingredientes || []).map(i => i.nombre)
  ].join(' ').toLowerCase();

  const esCarneOPescado = /solomillo|ternera|vaca|cerdo|jamon|bacon|pollo|pato|cordero|morcilla|chorizo|pescado|sardina|merluza|bacalao|atun|bonito|salmon|anchoa|lubina|dorada|gamba|langostino|marisco|mejillon|almeja|pulpo|calamar|chipiron|ostra/.test(textoCombinado);
  const tieneLacteosOHuevos = /queso|leche|nata|mantequilla|crema|bechamel|yogur|huevo|mayonesa|alioli|tortilla|huancaína/.test(textoCombinado);

  const esVegetariano = !esCarneOPescado;
  const esVegano = esVegetariano && !tieneLacteosOHuevos;

  return { esVegetariano, esVegano };
}

export function AlergenosView({ platos = [], ingredientesBase = [], actualizarStockIngrediente }) {
  const [selectedIngr, setSelectedIngr] = useState(null);
  const [selectedAlergenos, setSelectedAlergenos] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [filtroDieta, setFiltroDieta] = useState('todos'); // 'todos', 'vegetariano', 'vegano'

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

  // Filtrado dinámico por dieta
  const platosFiltrados = catalogPlatos.filter(plato => {
    const { esVegetariano, esVegano } = evaluarDietaPlato(plato);
    if (filtroDieta === 'vegetariano') return esVegetariano;
    if (filtroDieta === 'vegano') return esVegano;
    return true;
  });

  const handlePrint = () => {
    window.print();
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
      {/* Action Bar */}
      <div className="flex-between mb-24 no-print">
        <div className="banner banner-info flex-1 mr-16 flex-center-start gap-10">
          <Info size={18} className="text-accent flex-none" />
          <span className="text-sm font-medium">
            <strong>Reglamento UE 1169/2011:</strong> Fichas de alérgenos y clasificación para dietas Vegetarianas (🌱) y Veganas (🌿) calculadas dinámicamente.
          </span>
        </div>
        <div className="flex-center gap-10 flex-none">
          <button onClick={() => setShowQR(!showQR)} className="btn btn-secondary flex-center gap-8 font-bold">
            <QrCode size={16} />
            <span>{showQR ? 'Ocultar QR' : 'Ver QR Mesas'}</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary flex-center gap-8 font-bold">
            <Printer size={16} />
            <span>Imprimir Carta Legal</span>
          </button>
        </div>
      </div>

      {/* Preview Modal QR */}
      {showQR && (
        <div className="card p-24 mb-24 text-center bg-surface border-accent shadow-md no-print">
          <QrCode className="mx-auto text-accent mb-8" size={80} />
          <h3 className="font-extrabold text-md mb-4 text-primary">Código QR para las mesas de tus comensales</h3>
          <p className="text-xs text-muted mb-12">Tus clientes ven la carta de alérgenos y dietas en tiempo real escaneando el QR.</p>
          <span className="badge badge-accent font-bold">https://restaurantes.aironlabs.com/alergenos/demo</span>
        </div>
      )}

      {/* Leyenda de los 14 Alérgenos UE */}
      <div className="card p-16 mb-24">
        <h3 className="font-bold text-xs mb-12 text-muted uppercase tracking-wider">Los 14 Alérgenos de Declaración Obligatoria (UE)</h3>
        <div className="grid-7 gap-8 text-center text-xs">
          {LISTA_ALERGENOS_UE.map(a => (
            <div key={a.id} className="p-8 rounded-8 bg-surface border border-subtle">
              <span className="text-xl block mb-2">{a.icono}</span>
              <span className="font-semibold text-primary">{a.nombre}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla Oficial / Carta de Alérgenos y Dietas por Plato */}
      <div className="card overflow-hidden">
        <div className="p-16 bg-surface border-b flex-between flex-wrap gap-12">
          <h2 className="title-md flex-center gap-8">
            <ShieldCheck className="text-success" size={20} />
            <span>Carta Oficial de Alérgenos & Dietas Especiales</span>
          </h2>

          {/* Filtros de Dieta */}
          <div className="flex-center gap-8 no-print">
            <button
              onClick={() => setFiltroDieta('todos')}
              className={`btn btn-sm ${filtroDieta === 'todos' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Todos ({catalogPlatos.length})
            </button>
            <button
              onClick={() => setFiltroDieta('vegetariano')}
              className={`btn btn-sm ${filtroDieta === 'vegetariano' ? 'btn-primary' : 'btn-ghost'}`}
            >
              🌱 Vegetarianos ({catalogPlatos.filter(p => evaluarDietaPlato(p).esVegetariano).length})
            </button>
            <button
              onClick={() => setFiltroDieta('vegano')}
              className={`btn btn-sm ${filtroDieta === 'vegano' ? 'btn-primary' : 'btn-ghost'}`}
            >
              🌿 Veganos ({catalogPlatos.filter(p => evaluarDietaPlato(p).esVegano).length})
            </button>
          </div>
        </div>

        <table className="table-custom">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Plato</th>
              <th>PVP</th>
              <th>Alérgenos Detectados</th>
              <th>Vegetariano 🌱</th>
              <th>Vegano 🌿</th>
              <th className="no-print">Estado Ficha</th>
            </tr>
          </thead>
          <tbody>
            {platosFiltrados.map((plato) => {
              const listAlerg = plato.alergenos || [];
              const { esVegetariano, esVegano } = evaluarDietaPlato(plato);

              return (
                <tr key={plato.id}>
                  <td>
                    <span className="badge badge-neutral">
                      {(plato.categoria && plato.categoria !== 'Otros' && plato.categoria !== 'Principal')
                        ? plato.categoria
                        : deducirCategoriaPlato(plato.nombre, plato.ingredientes)}
                    </span>
                  </td>
                  <td className="font-extrabold text-md text-primary">{plato.nombre}</td>
                  <td className="font-bold text-accent">{(parseFloat(plato.precioVenta) || 0).toFixed(2)}€</td>
                  <td>
                    {listAlerg.length === 0 ? (
                      <span className="text-xs text-success font-bold">✓ Sin alérgenos declarados</span>
                    ) : (
                      <div className="flex-wrap gap-6">
                        {listAlerg.map((alergId) => {
                          const info = LISTA_ALERGENOS_UE.find(a => a.id === alergId);
                          
                          const ingsCausantes = (plato.ingredientes || [])
                            .filter(ing => {
                              const algs = Array.isArray(ing.alergenos) && ing.alergenos.length > 0
                                ? ing.alergenos
                                : deducirAlergenos(ing.nombre);
                              return algs.includes(alergId);
                            })
                            .map(ing => ing.nombre);

                          const tooltipTexto = ingsCausantes.length > 0 
                            ? `Causado por: ${ingsCausantes.join(', ')}` 
                            : `Presente en la receta de ${plato.nombre}`;

                          return (
                            <span 
                              key={alergId}
                              title={tooltipTexto}
                              style={{ cursor: 'help' }}
                              className="badge badge-warning text-xs font-bold flex-center gap-4 hover:scale-105 transition-transform"
                            >
                              <span>{info?.icono || '⚠️'}</span>
                              <span>{info?.nombre || alergId}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td>
                    {esVegetariano ? (
                      <span className="badge badge-success flex-center gap-4 font-bold text-xs" title="Apto para vegetarianos (sin carne ni pescado)">
                        🌱 Sí
                      </span>
                    ) : (
                      <span className="badge badge-neutral text-xs text-muted" title="Contiene proteína de carne o pescado">
                        ❌ No
                      </span>
                    )}
                  </td>
                  <td>
                    {esVegano ? (
                      <span className="badge badge-success flex-center gap-4 font-bold text-xs" title="Apto para veganos (100% origen vegetal)">
                        🌿 Sí
                      </span>
                    ) : (
                      <span className="badge badge-neutral text-xs text-muted" title="Contiene lácteos, huevos, carne o pescado">
                        ❌ No
                      </span>
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
              Marca los alérgenos presentes en este ingrediente base. Todos los platos que lo usen se actualizarán en tiempo real.
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
