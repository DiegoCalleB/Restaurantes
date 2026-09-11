import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Trash2, Clock, Scale, Save, Loader2, Wand2 } from 'lucide-react';
import { parsearRecetaConIA } from '../geminiService';

const LISTA_CATEGORIAS = [
  'Entrantes & Raciones',
  'Primeros & Sopas',
  'Pastas & Arroces',
  'Carnes & Parrilla',
  'Pescados & Mariscos',
  'Postres Caseros',
  'Bebidas & Bodega',
  'Otros'
];

export default function EditarEscandalloModal({ plato, ingredientesBase = [], isOpen, onClose, onGuardar }) {
  if (!isOpen || !plato) return null;

  const [nombre, setNombre] = useState(plato.nombre || '');
  const [precioVenta, setPrecioVenta] = useState(plato.precioVenta || plato.precio_venta || 0);
  const [categoria, setCategoria] = useState(plato.categoria || 'Otros');
  const [tiempoPreparacion, setTiempoPreparacion] = useState(plato.tiempo_preparacion || plato.tiempoPreparacion || 15);
  
  // Líneas del escandallo
  const [lineas, setLineas] = useState([]);
  
  // Estado para la función "Subir Receta (IA)"
  const [textoIa, setTextoIa] = useState('');
  const [showIaSection, setShowIaSection] = useState(false);
  const [loadingIa, setLoadingIa] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plato) {
      setNombre(plato.nombre || '');
      setPrecioVenta(plato.precioVenta || plato.precio_venta || 0);
      setCategoria(plato.categoria || 'Otros');
      setTiempoPreparacion(plato.tiempo_preparacion || plato.tiempoPreparacion || 15);
      
      // Mapear ingredientes actuales del plato
      const ingrActuales = (plato.ingredientes || []).map(ing => {
        // Encontrar ingrediente_id
        const foundBase = ingredientesBase.find(b => b.nombre.toLowerCase() === ing.nombre.toLowerCase());
        return {
          ingrediente_id: foundBase ? foundBase.id : (ing.ingrediente_id || ''),
          nombre: ing.nombre,
          cantidad: ing.cantidad,
          unidad: ing.unidad || 'kg',
          coste: ing.coste || 0
        };
      });
      setLineas(ingrActuales);
    }
  }, [plato, ingredientesBase]);

  // Manejador para la función "Subir Receta (IA)"
  const handleParseRecetaIA = async () => {
    if (!textoIa.trim()) return;
    setLoadingIa(true);
    try {
      const resultado = await parsearRecetaConIA(textoIa, ingredientesBase);
      
      if (resultado.nombrePlato) setNombre(resultado.nombrePlato);
      if (resultado.tiempoPreparacionMinutos) setTiempoPreparacion(resultado.tiempoPreparacionMinutos);
      if (resultado.categoriaSugerida) setCategoria(resultado.categoriaSugerida);

      if (resultado.ingredientes && resultado.ingredientes.length > 0) {
        const nuevasLineas = resultado.ingredientes.map(item => {
          // Intentar matching con el catálogo de ingredientes
          const matched = ingredientesBase.find(b => 
            b.nombre.toLowerCase().includes(item.nombreIngrediente.toLowerCase()) ||
            item.nombreIngrediente.toLowerCase().includes(b.nombre.toLowerCase()) ||
            (item.nombreCatalogoEmparejado && b.nombre.toLowerCase().includes(item.nombreCatalogoEmparejado.toLowerCase()))
          );

          return {
            ingrediente_id: matched ? matched.id : (ingredientesBase[0] ? ingredientesBase[0].id : ''),
            nombre: matched ? matched.nombre : item.nombreIngrediente,
            cantidad: parseFloat(item.cantidad) || 0.1,
            unidad: matched ? matched.unidad_medida : (item.unidadMedida || 'kg'),
            coste: matched ? (matched.precio_estimado * item.cantidad) : 0
          };
        });
        setLineas(nuevasLineas);
      }
      setShowIaSection(false);
      setTextoIa('');
    } catch (err) {
      console.error("Error al parsear receta con IA:", err);
      alert("No se pudo procesar la receta con IA. Revisa que el texto sea claro.");
    } finally {
      setLoadingIa(false);
    }
  };

  // Agregar nueva línea de ingrediente manualmente
  const handleAddLinea = () => {
    if (!ingredientesBase.length) return;
    const prim = ingredientesBase[0];
    setLineas([...lineas, {
      ingrediente_id: prim.id,
      nombre: prim.nombre,
      cantidad: 0.100,
      unidad: prim.unidad_medida || 'kg',
      coste: prim.precio_estimado * 0.1
    }]);
  };

  // Cambiar ingrediente seleccionado en una línea
  const handleLineaIngredienteChange = (index, ingredienteId) => {
    const found = ingredientesBase.find(i => i.id === ingredienteId);
    if (!found) return;
    const list = [...lineas];
    list[index] = {
      ...list[index],
      ingrediente_id: found.id,
      nombre: found.nombre,
      unidad: found.unidad_medida,
      coste: (found.precio_estimado || 0) * list[index].cantidad
    };
    setLineas(list);
  };

  // Cambiar cantidad de ingrediente
  const handleLineaCantidadChange = (index, cantidadNum) => {
    const list = [...lineas];
    const found = ingredientesBase.find(i => i.id === list[index].ingrediente_id);
    const precioKg = found ? (found.precio_estimado || 0) : 0;
    list[index].cantidad = cantidadNum;
    list[index].coste = precioKg * cantidadNum;
    setLineas(list);
  };

  // Eliminar línea
  const handleRemoveLinea = (index) => {
    setLineas(lineas.filter((_, idx) => idx !== index));
  };

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true);
    try {
      const datosPlato = {
        nombre,
        precioVenta: parseFloat(precioVenta) || 0,
        categoria,
        tiempo_preparacion: parseInt(tiempoPreparacion, 10) || 15
      };

      const lineasValid = lineas.filter(l => l.ingrediente_id && l.cantidad > 0);

      if (onGuardar) {
        await onGuardar(plato.id, datosPlato, lineasValid);
      }
      onClose();
    } catch (e) {
      console.error("Error guardando escandallo:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      zIndex: 2500,
      padding: 16
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 720,
        maxHeight: '90vh',
        overflowY: 'auto',
        color: 'var(--text)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        padding: 24
      }}>

        {/* HEADER MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: 'var(--text)' }}>
              Editar Escandallo: {plato.nombre}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--textSoft)', marginTop: 2 }}>
              Ajusta los ingredientes, gramajes, PVP y tiempo de preparación
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--textSoft)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* BOTÓN DESPLEGABLE DE SUBIR RECETA CON IA */}
        <div style={{ marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => setShowIaSection(!showIaSection)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15), rgba(217, 119, 6, 0.05))',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              color: '#d97706', fontSize: 13, fontWeight: 800, cursor: 'pointer'
            }}
          >
            <Wand2 size={16} />
            <span>{showIaSection ? 'Cerrar Asistente IA' : '✨ Subir Receta en Texto con IA (Autorellenar)'}</span>
          </button>

          {showIaSection && (
            <div style={{
              marginTop: 12, padding: 16, background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)'
            }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', display: 'block', marginBottom: 6 }}>
                Pega o escribe la receta en lenguaje natural:
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Para la Tarta de Queso uso 500g de queso crema, 200ml de nata, 3 huevos y 150g de azúcar. Tiempo de cocción 45 minutos."
                value={textoIa}
                onChange={(e) => setTextoIa(e.target.value)}
                style={{
                  width: '100%', padding: 10, borderRadius: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={handleParseRecetaIA}
                disabled={loadingIa || !textoIa.trim()}
                style={{
                  marginTop: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
                  border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                  opacity: loadingIa ? 0.7 : 1
                }}
              >
                {loadingIa ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
                {loadingIa ? 'Parseando Receta con Gemini...' : 'Procesar Receta con IA'}
              </button>
            </div>
          )}
        </div>

        {/* CAMPOS PRINCIPALES DEL PLATO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Nombre del Plato
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13.5, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box'
              }}
            >
              {LISTA_CATEGORIAS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              PVP en Carta (€)
            </label>
            <input
              type="number"
              step="0.10"
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13.5, fontWeight: 800, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase', display: 'block', marginBottom: 6, whiteSpace: 'nowrap' }}>
              ⏱️ Tiempo (min)
            </label>
            <input
              type="number"
              step="1"
              value={tiempoPreparacion}
              onChange={(e) => setTiempoPreparacion(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 13.5, fontWeight: 800, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* TABLA DE INGREDIENTES Y GRAMAJES */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Scale size={16} style={{ color: 'var(--accent)' }} /> Ingredientes y Raciones de la Receta
            </div>
            <button
              type="button"
              onClick={handleAddLinea}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Añadir Ingrediente
            </button>
          </div>

          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 800, color: 'var(--textSoft)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', width: '50%' }}>Ingrediente Base</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', width: '25%' }}>Cantidad por ración</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', width: '15%' }}>Coste</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((linea, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 14px' }}>
                      <select
                        value={linea.ingrediente_id}
                        onChange={(e) => handleLineaIngredienteChange(idx, e.target.value)}
                        style={{
                          width: '100%', padding: '6px 10px', borderRadius: 8,
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 13, fontWeight: 600, outline: 'none'
                        }}
                      >
                        {ingredientesBase.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.nombre} ({ing.precio_estimado}€/{ing.unidad_medida})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '8px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number"
                          step="0.005"
                          value={linea.cantidad}
                          onChange={(e) => handleLineaCantidadChange(idx, parseFloat(e.target.value) || 0)}
                          style={{
                            width: 80, padding: '6px 8px', borderRadius: 8,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            color: 'var(--text)', fontSize: 13, fontWeight: 700, outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)' }}>
                          {linea.unidad}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800, color: '#d97706' }}>
                      €{(linea.coste || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveLinea(idx)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lineas.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--textSoft)' }}>
                No hay ingredientes agregados a la receta aún. Pulsa en "+ Añadir Ingrediente" o usa el asistente IA.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACCIONES */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accentDeep))',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 110, 165, 0.3)',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
