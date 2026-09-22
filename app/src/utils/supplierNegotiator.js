/**
 * Módulo Agente Negociador de Proveedores
 * Genera mensajes automáticos de reclamación de notas de abono y solicitudes de abono
 * por discrepancias de precios o mercancía, listos para enviar por WhatsApp o Email en 1 clic.
 */

export function generarReclamacionProveedor({
  proveedorNombre = 'Proveedor',
  comercialTelefono = '',
  comercialEmail = '',
  numeroAlbaran = 'ALB-001',
  fechaAlbaran = 'Hoy',
  restauranteNombre = 'Silvestre Vinos y Comidas',
  itemsConDiscrepancia = [],
  importeReclamado = 0
}) {
  const lineasDetalle = itemsConDiscrepancia.length > 0 
    ? itemsConDiscrepancia.map(item => `• ${item.producto}: ${item.motivo || 'Diferencia de precio'} (${item.diferenciaEuros ? `${item.diferenciaEuros.toFixed(2)}€` : ''})`).join('\n')
    : `• Diferencia de facturación en el albarán ${numeroAlbaran}`;

  const totalStr = importeReclamado > 0 ? `${importeReclamado.toFixed(2)}€` : 'el importe correspondiente';

  // 1. TEXTO PARA WHATSAPP
  const mensajeWhatsApp = 
`Hola ${proveedorNombre}, te escribo desde ${restauranteNombre} sobre el albarán N° *${numeroAlbaran}* del *${fechaAlbaran}*.

Hemos revisado la mercancía y detectado las siguientes discrepancias:
${lineasDetalle}

Por favor, remítenos la *nota de abono por ${totalStr}* o ajústalo en la próxima factura.

¡Muchas gracias! 🙏`;

  // Enlace directo a WhatsApp (si viene teléfono se añade, sino abre selector de chat)
  const phoneClean = comercialTelefono.replace(/[^0-9]/g, '');
  const urlWhatsApp = phoneClean 
    ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensajeWhatsApp)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeWhatsApp)}`;

  // 2. TEXTO PARA EMAIL FORMAL
  const asuntoEmail = `Reclamación Nota de Abono - Albarán N° ${numeroAlbaran} - ${restauranteNombre}`;
  const cuerpoEmail = 
`Estimado equipo de ${proveedorNombre},

Les escribimos en relación al albarán N° ${numeroAlbaran} con fecha ${fechaAlbaran} emitido para nuestro establecimiento ${restauranteNombre}.

Tras el proceso de recepción y conciliación de albaranes, hemos identificado las siguientes diferencias en los precios/cantidades acordados:

${lineasDetalle}

Les rogamos emitan la correspondiente Nota de Abono por un valor total de ${totalStr} a la mayor brevedad posible.

Quedamos a la espera de su confirmación.

Un cordial saludo,
Equipo de Dirección de ${restauranteNombre}`;

  const urlEmail = `mailto:${comercialEmail || ''}?subject=${encodeURIComponent(asuntoEmail)}&body=${encodeURIComponent(cuerpoEmail)}`;

  return {
    proveedorNombre,
    numeroAlbaran,
    importeReclamado,
    mensajeWhatsApp,
    urlWhatsApp,
    asuntoEmail,
    cuerpoEmail,
    urlEmail
  };
}
