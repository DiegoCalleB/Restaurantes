import React, { useState } from 'react';
import { ShoppingCart, Send, AlertTriangle, CheckCircle, Package, RefreshCw } from 'lucide-react';

export function PedidosView({ ingredientesBase = [], proveedores = [], actualizarStockIngrediente }) {
  const [editingId, setEditingId] = useState(null);
  const [tempStock, setTempStock] = useState('');
  const [tempMin, setTempMin] = useState('');
  const [mensajeEnviado, setMensajeEnviado] = useState(null);

  // Mock de ingredientes si viene vacío de Supabase para demostración fluida
  const catalog = ingredientesBase.length > 0 ? ingredientesBase : [
    { id: '1', nombre: 'Solomillo de Ternera', unidad_medida: 'kg', precio_estimado: 24.90, stock_actual: 3.5, stock_minimo: 10.0, proveedor: 'Distribuciones Ibérica S.L.' },
    { id: '2', nombre: 'Aceite de Oliva Virgen Extra 5L', unidad_medida: 'unidades', precio_estimado: 19.50, stock_actual: 2.0, stock_minimo: 6.0, proveedor: 'Distribuciones Ibérica S.L.' },
    { id: '3', nombre: 'Tomate Rama 10kg', unidad_medida: 'unidades', precio_estimado: 16.80, stock_actual: 1.0, stock_minimo: 4.0, proveedor: 'Mercafresh Mayoristas' },
    { id: '4', nombre: 'Harina de Trigo 25kg', unidad_medida: 'unidades', precio_estimado: 22.10, stock_actual: 5.0, stock_minimo: 3.0, proveedor: 'Distribuciones Ibérica S.L.' },
    { id: '5', nombre: 'Merluza Fresca', unidad_medida: 'kg', precio_estimado: 20.45, stock_actual: 8.0, stock_minimo: 8.0, proveedor: 'Pescados La Rada' }
  ];

  // Identificar faltas (stock_actual < stock_minimo)
  const faltas = catalog.filter(item => (item.stock_actual || 0) < (item.stock_minimo || 0));

  // Agrupar faltas por proveedor
  const pedidosPorProveedor = faltas.reduce((acc, item) => {
    const provNombre = item.proveedor || 'Distribuciones Ibérica S.L.';
    if (!acc[provNombre]) acc[provNombre] = [];
    const faltaCantidad = (item.stock_minimo || 0) - (item.stock_actual || 0);
    acc[provNombre].push({
      ...item,
      cantidadSugerida: Math.ceil(faltaCantidad)
    });
    return acc;
  }, {});

  const handleSaveStock = async (id) => {
    if (actualizarStockIngrediente) {
      await actualizarStockIngrediente(id, {
        stock_actual: parseFloat(tempStock) || 0,
        stock_minimo: parseFloat(tempMin) || 0
      });
    }
    setEditingId(null);
  };

  const generarWhatsAppLink = (provNombre, items) => {
    const lineasTexto = items.map(i => `• ${i.nombre}: ${i.cantidadSugerida} ${i.unidad_medida}`).join('\n');
    const mensaje = `Hola *${provNombre}*, me gustaría hacer el siguiente pedido sugerido desde *Restaurantes*:\n\n${lineasTexto}\n\nPor favor, confírmanos fecha de entrega. ¡Gracias!`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
  };

  const handleSendWhatsApp = (provNombre, items) => {
    const link = generarWhatsAppLink(provNombre, items);
    window.open(link, '_blank');
    setMensajeEnviado(`Pedido enviado a ${provNombre} por WhatsApp`);
    setTimeout(() => setMensajeEnviado(null), 4000);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="flex-between mb-24">
        <div>
          <h1 className="title-lg">Pedidos Sugeridos 1-Click</h1>
          <p className="subtitle">
            Cálculo automático de faltas por Par Stock (Stock Mínimo) y pedido directo por WhatsApp
          </p>
        </div>
        <div className="badge-pill bg-accent-soft text-accent flex-center gap-8">
          <ShoppingCart size={16} />
          <span>{faltas.length} ingredientes bajo mínimo</span>
        </div>
      </div>

      {mensajeEnviado && (
        <div className="banner banner-success mb-20 flex-center gap-10">
          <CheckCircle size={18} />
          <span>{mensajeEnviado}</span>
        </div>
      )}

      {/* Grid: Pedidos Sugeridos por Proveedor */}
      <h2 className="title-md mb-16 flex-center-start gap-8">
        <Send className="text-accent" size={20} />
        <span>Pedidos Sugeridos Generados ({Object.keys(pedidosPorProveedor).length} Proveedores)</span>
      </h2>

      {Object.keys(pedidosPorProveedor).length === 0 ? (
        <div className="card p-32 text-center mb-28">
          <CheckCircle className="text-success mx-auto mb-12" size={40} />
          <h3 className="font-bold text-lg mb-4">¡Todo el stock está cubierto!</h3>
          <p className="text-muted">Ningún ingrediente ha bajado de su stock mínimo configurado.</p>
        </div>
      ) : (
        <div className="grid-2 gap-16 mb-32">
          {Object.entries(pedidosPorProveedor).map(([provNombre, items]) => {
            const totalEstimado = items.reduce((sum, i) => sum + (i.cantidadSugerida * (i.precio_estimado || 0)), 0);
            return (
              <div key={provNombre} className="card p-20 flex-column justify-between shadow-sm border-accent-left">
                <div>
                  <div className="flex-between mb-12">
                    <span className="font-bold text-md flex-center gap-8">
                      <Package size={18} className="text-accent" />
                      {provNombre}
                    </span>
                    <span className="badge badge-warning font-semibold">Estado: Borrador</span>
                  </div>

                  <div className="divider mb-12"></div>

                  <div className="space-y-8 mb-16">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex-between text-sm py-4 border-b-subtle">
                        <div>
                          <span className="font-medium">{it.nombre}</span>
                          <span className="text-xs text-muted block">Stock: {it.stock_actual} / Mínimo: {it.stock_minimo} {it.unidad_medida}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-accent">+{it.cantidadSugerida} {it.unidad_medida}</span>
                          <span className="text-xs text-muted block">≈ {(it.cantidadSugerida * (it.precio_estimado || 0)).toFixed(2)}€</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex-between text-sm mb-14 font-semibold">
                    <span>Importe Estimado:</span>
                    <span className="text-md font-extrabold">≈ {totalEstimado.toFixed(2)}€</span>
                  </div>

                  <button
                    onClick={() => handleSendWhatsApp(provNombre, items)}
                    className="btn btn-whatsapp w-full flex-center gap-8 font-bold"
                  >
                    <Send size={16} />
                    <span>Enviar Pedido por WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla de Gestión Par Stock */}
      <h2 className="title-md mb-16 flex-center-start gap-8">
        <RefreshCw className="text-accent" size={20} />
        <span>Control de Par Stock por Ingrediente</span>
      </h2>

      <div className="card overflow-hidden">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Ingrediente Base</th>
              <th>Unidad</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo (Par Stock)</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((item) => {
              const esBajoMinimo = (item.stock_actual || 0) < (item.stock_minimo || 0);
              const isEditing = editingId === item.id;

              return (
                <tr key={item.id} className={esBajoMinimo ? 'bg-danger-soft' : ''}>
                  <td className="font-semibold">{item.nombre}</td>
                  <td className="text-muted">{item.unidad_medida}</td>

                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="input-sm w-80"
                        value={tempStock}
                        onChange={e => setTempStock(e.target.value)}
                      />
                    ) : (
                      <span className="font-bold">{item.stock_actual || 0} {item.unidad_medida}</span>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        className="input-sm w-80"
                        value={tempMin}
                        onChange={e => setTempMin(e.target.value)}
                      />
                    ) : (
                      <span>{item.stock_minimo || 0} {item.unidad_medida}</span>
                    )}
                  </td>

                  <td>
                    {esBajoMinimo ? (
                      <span className="badge badge-danger flex-center-start gap-4">
                        <AlertTriangle size={12} /> Bajo Mínimo
                      </span>
                    ) : (
                      <span className="badge badge-success flex-center-start gap-4">
                        <CheckCircle size={12} /> Óptimo
                      </span>
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <button onClick={() => handleSaveStock(item.id)} className="btn btn-sm btn-primary">
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setTempStock(item.stock_actual || 0);
                          setTempMin(item.stock_minimo || 0);
                        }}
                        className="btn btn-sm btn-ghost"
                      >
                        Editar Stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
