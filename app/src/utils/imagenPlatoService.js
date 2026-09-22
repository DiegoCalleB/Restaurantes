// Mapeo de fotos gastronómicas de alta calidad para Silvestre Vinos & Comidas
const DEMO_IMAGES = {
  brioche_sardina: '/platos/brioche_sardina.png',
  tosta_trufa: '/platos/tosta_setas_trufa.png',
  alcachofas: '/platos/alcachofas_romesco.png',
  torrija: '/platos/torrija_caramelizada.png',
  hamburguesa: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  bravas: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
  ensaladilla: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  mejillones: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
  arroz: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  tartar: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  albondigas: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
  panceta: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  tacos: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  fideua: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
  canelones: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&w=800&q=80',
  creme_brulee: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
};

export function obtenerImagenPlato(plato) {
  if (!plato) return DEMO_IMAGES.default;
  if (plato.imagen_url && plato.imagen_url.trim() !== '') {
    return plato.imagen_url;
  }
  if (plato.imagenUrl && plato.imagenUrl.trim() !== '') {
    return plato.imagenUrl;
  }

  const texto = `${plato.nombre || ''} ${plato.categoria || ''}`.toLowerCase();

  if (/sardina|brioche.*sardina/.test(texto)) return DEMO_IMAGES.brioche_sardina;
  if (/tosta|setas.*trufa/.test(texto)) return DEMO_IMAGES.tosta_trufa;
  if (/alcachofa/.test(texto)) return DEMO_IMAGES.alcachofas;
  if (/torrija/.test(texto)) return DEMO_IMAGES.torrija;
  if (/ensaladilla|rusa|huancaína/.test(texto)) return DEMO_IMAGES.ensaladilla;
  if (/mejillón|mejillones/.test(texto)) return DEMO_IMAGES.mejillones;
  if (/arroz/.test(texto)) return DEMO_IMAGES.arroz;
  if (/tartar/.test(texto)) return DEMO_IMAGES.tartar;
  if (/albóndiga|albondiga/.test(texto)) return DEMO_IMAGES.albondigas;
  if (/panceta/.test(texto)) return DEMO_IMAGES.panceta;
  if (/taco|tacos|atún/.test(texto)) return DEMO_IMAGES.tacos;
  if (/fideuá|fideua/.test(texto)) return DEMO_IMAGES.fideua;
  if (/canelón|canelones/.test(texto)) return DEMO_IMAGES.canelones;
  if (/hamburguesa|burger|smash/.test(texto)) return DEMO_IMAGES.hamburguesa;
  if (/brava|patatas/.test(texto)) return DEMO_IMAGES.bravas;
  if (/brûlée|brule|creme|crema/.test(texto)) return DEMO_IMAGES.creme_brulee;

  return DEMO_IMAGES.default;
}

// Función para comprimir una foto client-side en un HTML5 Canvas antes de subirse
export function comprimirImagen(file, maxWidth = 800, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a DataURL Base64 o Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve({ file: compressedFile, dataUrl });
            } else {
              reject(new Error("Error al comprimir la imagen"));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
