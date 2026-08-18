export const albaranesData = [
  { id:1, numero:'A-2026-0842', proveedor:'Distribuciones Ibérica S.L.', fecha:'08/08/2026', importe:'493.40', estado:'incidencia',
    confProveedor:98, confNumero:96, confFecha:99, confImporte:88,
    items:[
      {producto:'Solomillo de ternera 5kg', cantidad:10, precioUnit:'24.90', total:'249.00', flag:false},
      {producto:'Aceite de oliva virgen 5L', cantidad:8, precioUnit:'19.50', total:'156.00', flag:true, motivo:'Cantidad recibida (8) no coincide con el pedido (6)'},
      {producto:'Harina de trigo 25kg', cantidad:4, precioUnit:'22.10', total:'88.40', flag:true, motivo:'Precio +17,9% sobre el precio pactado (18,75€)'},
    ]},
  { id:2, numero:'A-2026-0839', proveedor:'Mercafresh Mayoristas', fecha:'07/08/2026', importe:'318.60', estado:'validado',
    confProveedor:99, confNumero:98, confFecha:99, confImporte:97,
    items:[
      {producto:'Lechuga iceberg caja 12ud', cantidad:6, precioUnit:'14.20', total:'85.20', flag:false},
      {producto:'Tomate rama 10kg', cantidad:8, precioUnit:'16.80', total:'134.40', flag:false},
      {producto:'Cebolla 25kg', cantidad:4, precioUnit:'24.75', total:'99.00', flag:false},
    ]},
  { id:6, numero:'A-2026-0847', proveedor:'Distribuciones Ibérica S.L.', fecha:'08/08/2026', importe:'171.20', estado:'pendiente',
    confProveedor:96, confNumero:90, confFecha:97, confImporte:84,
    items:[
      {producto:'Aceite de girasol 5L', cantidad:6, precioUnit:'12.80', total:'76.80', flag:false},
      {producto:'Pimentón dulce 1kg', cantidad:8, precioUnit:'11.80', total:'94.40', flag:false},
    ]},
];

export const proveedoresData = [
  {nombre:'Distribuciones Ibérica S.L.', numAlbaranes:34, importeTotal:'18420.00', incidenciasPct:12, variacionPrecio:6.2, puntualidad:91},
  {nombre:'Mercafresh Mayoristas', numAlbaranes:28, importeTotal:'12980.00', incidenciasPct:4, variacionPrecio:1.1, puntualidad:98},
  {nombre:'Carnes Selectas del Norte', numAlbaranes:19, importeTotal:'9640.00', incidenciasPct:2, variacionPrecio:0.8, puntualidad:100},
];

export const localesData = [
  {nombre:'La Marea · Centro', albaranes:41, gasto:'21480.00', incidencias:5},
  {nombre:'La Marea · Puerto', albaranes:33, gasto:'17920.00', incidencias:3},
  {nombre:'La Marea · Norte', albaranes:27, gasto:'14260.00', incidencias:7},
  {nombre:'La Marea · Sur', albaranes:19, gasto:'9640.00', incidencias:2},
];

// Helpers
const avatarPalette = ['#3B6EA5','#8B5E3C','#5C8A66','#A05C6B','#6B6191','#9C7C3E'];
export function getInitials(name) { 
  return name.split(' ').filter(w=>w.length>2||/^[A-ZÁÉÍÓÚ]/.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2) || name.slice(0,2).toUpperCase(); 
}
export function getAvatarBg(name) { 
  let h=0; 
  for(const ch of name) h = (h*31 + ch.charCodeAt(0)) % avatarPalette.length; 
  return avatarPalette[h]; 
}

export function getStatusMeta(estado) {
  if (estado === 'validado') return { label:'Validado', color:'var(--success)', bg:'var(--successSoft)' };
  if (estado === 'incidencia') return { label:'Incidencia', color:'var(--danger)', bg:'var(--dangerSoft)' };
  return { label:'Pendiente revisión', color:'var(--warning)', bg:'var(--warningSoft)' };
}
