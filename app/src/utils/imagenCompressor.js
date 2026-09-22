/**
 * Utilidad de compresión y rotación de imágenes mediante HTML5 Canvas API
 * Reduce archivos pesados de cámara (15MB -> ~400KB) manteniendo nitidez para Gemini OCR.
 */

export async function compressAndRotateImage(file, rotationDegrees = 0, maxWidth = 1600, maxHeight = 2000, quality = 0.82) {
  // Si no es una imagen (ej. es un PDF), devolver el archivo original intacto
  if (!file || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado proporcional respetando maxWidth y maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Ajustar dimensiones del canvas según la rotación (90° o 270° intercambian ancho y alto)
        const rads = (rotationDegrees % 360) * (Math.PI / 180);
        const isRotated90 = Math.abs(rotationDegrees % 180) === 90;

        if (isRotated90) {
          canvas.width = height;
          canvas.height = width;
        } else {
          canvas.width = width;
          canvas.height = height;
        }

        // Aplicar transformación y rotación al canvas
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rads);
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();

        // Exportar como Blob JPEG comprimido
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback al archivo original si falla
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
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
