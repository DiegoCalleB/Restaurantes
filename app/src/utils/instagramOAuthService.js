/**
 * Módulo de Autenticación Meta OAuth 2.0 para Instagram Graph API
 * 
 * Flujo Completo OAuth 2.0:
 * 1. Redirección al diálogo de autorización de Meta con scopes:
 *    - instagram_basic
 *    - instagram_content_publish
 *    - pages_show_list
 *    - pages_read_engagement
 * 2. Recepción del código de autorización temporal (?code=...) en la callback URI.
 * 3. Canje del código por un Short-Lived Access Token.
 * 4. Intercambio por un Long-Lived User/Page Access Token (60 días).
 * 5. Resolución automática de la Instagram Business Account ID vinculada a la Fanpage.
 */

export function obtenerUrlMetaOAuth({ appId, redirectUri, state = 'silvestre_auth' }) {
  if (!appId || !redirectUri) {
    throw new Error('Debes proporcionar appId y redirectUri para iniciar el flujo de Meta OAuth 2.0');
  }

  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement'
  ].join(',');

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state: state
  });

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function canjearCodigoPorTokenLargaDuracion({ code, appId, appSecret, redirectUri }) {
  if (!code || !appId || !redirectUri) {
    throw new Error('Faltan parámetros requeridos para el canje de código OAuth');
  }

  try {
    // Paso 1: Intercambiar el código temporal por el Short-Lived Token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', appId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', appSecret || '');
    tokenUrl.searchParams.append('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`Error en el canje de código Meta: ${tokenData.error.message}`);
    }

    const shortLivedToken = tokenData.access_token;

    // Paso 2: Convertir a Long-Lived Access Token (válido por ~60 días)
    let longLivedToken = shortLivedToken;
    let expiresIn = 5184000; // Default 60 días

    if (appSecret) {
      const longUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
      longUrl.searchParams.append('grant_type', 'fb_exchange_token');
      longUrl.searchParams.append('client_id', appId);
      longUrl.searchParams.append('client_secret', appSecret);
      longUrl.searchParams.append('fb_exchange_token', shortLivedToken);

      const longRes = await fetch(longUrl.toString());
      const longData = await longRes.json();

      if (!longData.error && longData.access_token) {
        longLivedToken = longData.access_token;
        expiresIn = longData.expires_in || expiresIn;
      }
    }

    // Paso 3: Obtener las Páginas de Facebook administradas por el usuario
    const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedToken}`);
    const pagesData = await pagesRes.json();

    if (pagesData.error) {
      throw new Error(`Error consultando páginas de Meta: ${pagesData.error.message}`);
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No se han encontrado Páginas de Facebook vinculadas a esta cuenta.');
    }

    const page = pagesData.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token || longLivedToken;

    // Paso 4: Obtener la cuenta de Instagram Business enlazada a la Página
    const igRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account,name&access_token=${pageAccessToken}`);
    const igData = await igRes.json();

    if (igData.error) {
      throw new Error(`Error localizando cuenta de Instagram: ${igData.error.message}`);
    }

    if (!igData.instagram_business_account) {
      throw new Error(`La Página de Facebook "${page.name}" no tiene una cuenta de Instagram Profesional/Business vinculada.`);
    }

    return {
      success: true,
      pageId: pageId,
      pageName: page.name,
      instagramAccountId: igData.instagram_business_account.id,
      accessToken: pageAccessToken,
      expiresIn: expiresIn
    };
  } catch (err) {
    console.error("Error en flujo de autenticación Meta OAuth:", err);
    throw err;
  }
}
