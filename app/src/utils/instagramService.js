/**
 * Módulo de Publicación Real en Instagram
 * Soporta dos vías de publicación:
 * 1. Webhook de automatización (Make.com / n8n / Zapier) - Recomendado para desarrollo rápido.
 * 2. Meta Graph API Oficial de Instagram Content Publishing.
 */

export async function publicarEnInstagram({ restaurante, imageUrl, caption, hashtags = [] }) {
  const fullCaption = `${caption}\n\n${Array.isArray(hashtags) ? hashtags.join(' ') : hashtags}`;
  const handle = restaurante?.instagram_handle || `@${restaurante?.nombre?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'restaurante'}`;

  // 1. VIA WEBHOOK (Make.com / n8n)
  if (restaurante?.instagram_webhook_url) {
    try {
      const response = await fetch(restaurante.instagram_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurante_id: restaurante.id,
          restaurante_nombre: restaurante.nombre,
          handle: handle,
          image_url: imageUrl,
          caption: fullCaption,
          hashtags: hashtags,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`El Webhook de Instagram respondió con código ${response.status}`);
      }

      return {
        success: true,
        method: 'webhook',
        handle: handle,
        message: `¡Publicación enviada con éxito al Webhook de Instagram para ${handle}!`
      };
    } catch (err) {
      console.error("Error publicando en Webhook de Instagram:", err);
      throw new Error(`Fallo al conectar con el Webhook de Instagram: ${err.message}`);
    }
  }

  // 2. VIA META GRAPH API (Oficial Directo)
  if (restaurante?.instagram_account_id && restaurante?.instagram_access_token) {
    try {
      const accountId = restaurante.instagram_account_id;
      const token = restaurante.instagram_access_token;

      // Paso 1: Crear el contenedor de medios en Instagram Graph API
      const createRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: fullCaption,
          access_token: token
        })
      });

      const createData = await createRes.json();
      if (createData.error) {
        throw new Error(`Meta API Error: ${createData.error.message}`);
      }

      const creationId = createData.id;

      // Paso 2: Publicar el contenedor creado
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${accountId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: token
        })
      });

      const publishData = await publishRes.json();
      if (publishData.error) {
        throw new Error(`Meta API Publish Error: ${publishData.error.message}`);
      }

      return {
        success: true,
        method: 'meta_api',
        handle: handle,
        postId: publishData.id,
        message: `¡Publicado de forma oficial en Instagram en la cuenta ${handle}! (ID: ${publishData.id})`
      };
    } catch (err) {
      console.error("Error en Meta Graph API:", err);
      throw new Error(`Fallo en Meta Graph API: ${err.message}`);
    }
  }

  // 3. MODO SIMULADO / DEMO DE PRUEBA (Si no hay credenciales configuradas aún)
  // Simulamos el proceso con delay para mostrar la experiencia de usuario
  await new Promise(resolve => setTimeout(resolve, 1800));

  return {
    success: true,
    method: 'demo',
    handle: handle,
    message: `¡Simulación completada! Para publicar en la cuenta real de ${handle}, configura el Webhook de Make.com o el Access Token de Meta en los ajustes del local.`
  };
}
