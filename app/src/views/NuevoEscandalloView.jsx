import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function NuevoEscandalloView({ setView, ingredientesBase = [], crearEscandallo }) {
  const [nombre, setNombre] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [ingredientes, setIngredientes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const addIngredientRow = () => {
    setIngredientes([...ingredientes, { id: Date.now(), ingrediente_id: '', cantidad: '' }]);
  };

  const removeIngredientRow = (id) => {
    setIngredientes(ingredientes.filter(ing => ing.id !== id));
  };

  const updateIngredientRow = (id, field, value) => {
    setIngredientes(ingredientes.map(ing => ing.id === id ? { ...ing, [field]: value } : ing));
  };

  const handleSave = async () => {
    if (!nombre.trim() || !precioVenta) return alert("Completa el nombre y el precio de venta.");
    if (ingredientes.length === 0) return alert("Añade al menos un ingrediente.");
    
    // Validate rows
    for (let ing of ingredientes) {
      if (!ing.ingrediente_id || !ing.cantidad) return alert("Completa todos los campos de los ingredientes.");
    }

    setIsSaving(true);
    
    const platoData = { nombre, precio_venta: parseFloat(precioVenta) };
    const ingredientesData = ingredientes.map(ing => ({
      ingrediente_id: ing.ingrediente_id,
      cantidad: parseFloat(ing.cantidad)
    }));

    const success = await crearEscandallo(platoData, ingredientesData);
    setIsSaving(false);
    
    if (success) {
      setView('platos');
    } else {
      alert("Error al guardar el escandallo.");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div 
          onClick={() => setView('platos')}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <ArrowLeft size={16} /> Volver a Escandallos
        </div>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 5 }}>Nuevo Escandallo</h2>
        <p style={{ color: 'var(--textSoft)', fontSize: 14 }}>Añade un nuevo plato a tu carta y define su receta.</p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(20,15,10,0.03)', maxWidth: 800 }}>
        
        {/* Datos del Plato */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 30 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Nombre del Plato</label>
            <input 
              type="text" 
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Ensalada Mixta"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--textSoft)', marginBottom: 6 }}>Precio de Venta (PVP)</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 14px' }}>
              <span style={{ color: 'var(--textSoft)', fontWeight: 700, marginRight: 8 }}>€</span>
              <input 
                type="number" 
                step="0.01"
                value={precioVenta}
                onChange={e => setPrecioVenta(e.target.value)}
                placeholder="12.50"
                style={{ width: '100%', padding: '10px 0', border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Ingredientes de la Receta</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {ingredientes.map((ing, idx) => {
              const selectedIngr = ingredientesBase.find(ib => ib.id === ing.ingrediente_id);
              const unidad = selectedIngr ? selectedIngr.unidad_medida : '';
              
              return (
                <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 40px', gap: 10, alignItems: 'center' }}>
                  <select 
                    value={ing.ingrediente_id}
                    onChange={e => updateIngredientRow(ing.id, 'ingrediente_id', e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, outline: 'none' }}
                  >
                    <option value="">Selecciona un ingrediente...</option>
                    {ingredientesBase.map(ib => (
                      <option key={ib.id} value={ib.id}>{ib.nombre}</option>
                    ))}
                  </select>
                  
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', overflow: 'hidden' }}>
                    <input 
                      type="number" 
                      step="0.001"
                      value={ing.cantidad}
                      onChange={e => updateIngredientRow(ing.id, 'cantidad', e.target.value)}
                      placeholder="0.000"
                      style={{ width: '100%', padding: '10px 0', border: 'none', background: 'transparent', fontSize: 14, outline: 'none' }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--textSoft)', marginLeft: 8 }}>{unidad}</span>
                  </div>

                  <button 
                    onClick={() => removeIngredientRow(ing.id)}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dangerSoft)', color: 'var(--danger)', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}
          </div>

          <button 
            onClick={addIngredientRow}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px dashed var(--border)', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: 'var(--textSoft)', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
          >
            <Plus size={16} /> Añadir ingrediente
          </button>
        </div>

        <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff', border: 'none',
              padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1,
              boxShadow: '0 4px 10px rgba(59, 110, 165, 0.3)'
            }}
          >
            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Receta'}
          </button>
        </div>

      </div>
    </div>
  );
}
