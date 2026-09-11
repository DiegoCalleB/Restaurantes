// Mapeo de fotos gastronómicas de alta calidad (Unsplash HD CDN)
const DEMO_IMAGES = {
  hamburguesa: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  bravas: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
  ensaladilla: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  croquetas: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
  carne: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  parrilla: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  pescado: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  marisco: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80',
  postre: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
  tarta: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
  vino: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  arroz: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281270?auto=format&fit=crop&w=800&q=80',
  ensalada: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
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

  if (/hamburguesa|burger/.test(texto)) return DEMO_IMAGES.hamburguesa;
  if (/brava|patatas/.test(texto)) return DEMO_IMAGES.bravas;
  if (/ensaladilla|rusa|huancaína/.test(texto)) return DEMO_IMAGES.ensaladilla;
  if (/croqueta/.test(texto)) return DEMO_IMAGES.croquetas;
  if (/carne|chuleton|solomillo|entrecot|vacuno/.test(texto)) return DEMO_IMAGES.carne;
  if (/parrilla|barbacoa|bbq/.test(texto)) return DEMO_IMAGES.parrilla;
  if (/pescado|merluza|bacalao|lubina|atún|salmón/.test(texto)) return DEMO_IMAGES.pescado;
  if (/marisco|gamba|langostino|pulpo|calamar/.test(texto)) return DEMO_IMAGES.marisco;
  if (/tarta|cheesecake|bizcocho/.test(texto)) return DEMO_IMAGES.tarta;
  if (/postre|helado|flan|brownie|torrija/.test(texto)) return DEMO_IMAGES.postre;
  if (/vino|bodega|copa|tinto|blanco/.test(texto)) return DEMO_IMAGES.vino;
  if (/arroz|paella|fideuá/.test(texto)) return DEMO_IMAGES.arroz;
  if (/pasta|espagueti|macarron|lasaña/.test(texto)) return DEMO_IMAGES.pasta;
  if (/ensalada/.test(texto)) return DEMO_IMAGES.ensalada;

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
