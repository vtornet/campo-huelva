// Service Worker para Agro Red - PWA con soporte offline y notificaciones push
// Versión 4 - Solo interceptar peticiones que necesitamos cachear

const CACHE_VERSION = "v4";
const STATIC_CACHE = `agro-red-static-${CACHE_VERSION}`;
const API_CACHE = `agro-red-api-${CACHE_VERSION}`;
const GENERAL_CACHE = `agro-red-general-${CACHE_VERSION}`;

// Dominios que NUNCA deben ser interceptados (Google Auth, Firebase, etc.)
const IGNORED_DOMAINS = [
  "accounts.google.com",
  "oauth2.googleapis.com",
  "www.googleapis.com",
  "firebase.googleapis.com",
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseruntime.googleapis.com",
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "www.facebook.com",
];

// Recursos estáticos críticos a cachear
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
];

// Patrones de API que podemos cachear (solo GET)
const CACHEABLE_API_PATTERNS = [
  "/api/posts",
  "/api/user/me",
];

// Instalación
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...");

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_ASSETS);
        console.log("[SW] Recursos estáticos cacheados");
      } catch (err) {
        console.warn("[SW] Error cacheando recursos:", err);
      }
    })()
  );
});

// Activación
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando...");

  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(
        (name) => !name.includes(CACHE_VERSION)
      );

      await Promise.all(
        cachesToDelete.map((name) => caches.delete(name))
      );

      console.log("[SW] Caches antiguos eliminados");
    })()
  );
});

// ============================================
// FETCH - ESTRATEGIA MEJORADA
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Ignorar peticiones no-HTTP (chrome-extension., data:, etc.)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // 2. IMPORTANTE: Ignorar completamente los dominios de Google Auth
  // NO hacer event.respondWith() para estas peticiones
  if (IGNORED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith("." + domain))) {
    // Dejar que el navegador maneje estas peticiones normalmente
    return;
  }

  // 3. Para peticiones POST/PUT/DELETE: nunca interceptar
  if (request.method !== "GET") {
    return;
  }

  // 4. Para imágenes: cache first
  if (request.destination === "image") {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // 5. Para fuentes: cache first
  if (request.destination === "font") {
    event.respondWith(handleFontRequest(request));
    return;
  }

  // 6. Para scripts y estilos: network first
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(handleScriptStyleRequest(request));
    return;
  }

  // 7. Para navegación (pages): network first con offline fallback
  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // 8. Para API endpoints específicos: network first
  if (url.pathname.startsWith("/api/")) {
    if (CACHEABLE_API_PATTERNS.some(pattern => url.pathname.startsWith(pattern))) {
      event.respondWith(handleAPIRequest(request));
      return;
    }
    // Para otras APIs, no interceptar
    return;
  }

  // 9. Para todo lo demás: NO interceptar, dejar pasar
  return;
});

// ============================================
// HANDLERS DE PETICIONES
// ============================================

// Imágenes: Cache First
async function handleImageRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Placeholder para imágenes
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#e5e7eb"/>
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#6b7280" font-size="14">Sin conexión</text>
      </svg>`,
      { headers: { "Content-Type": "image/svg+xml" } }
    );
  }
}

// Fuentes: Cache First
async function handleFontRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Scripts y estilos: Network First
async function handleScriptStyleRequest(request) {
  const cache = await caches.open(GENERAL_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Navegación: Network First con offline fallback
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Página offline
    return new Response(
      `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sin conexión - Agro Red</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container { text-align: center; color: white; max-width: 400px; }
          .icon { width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { color: #94a3b8; margin-bottom: 20px; line-height: 1.6; }
          button { background: #059669; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 16px; cursor: pointer; }
          button:hover { background: #047857; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">
            <svg width="40" height="40" fill="none" stroke="white" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          </div>
          <h1>Sin conexión</h1>
          <p>Parece que no tienes conexión a internet.<br>Verifica tu conexión e intenta de nuevo.</p>
          <button onclick="location.reload()">Reintentar</button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      }
    );
  }
}

// API: Network First
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(
      JSON.stringify({ error: "Sin conexión", message: "No hay conexión a internet." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener("push", (event) => {
  const data = event.data?.json();
  if (!data) return;

  const options = {
    body: data.body || "Tienes una nueva notificación de Agro Red",
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "general",
    requireInteraction: data.requireInteraction || false,
    data: { url: data.url || "/", notificationId: data.notificationId }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Agro Red", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/")
  );
});

// ============================================
// MENSAJES DEL CLIENTE
// ============================================

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((name) => caches.delete(name)));
      })
    );
  }
});
