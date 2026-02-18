// Service Worker para Red Agro - PWA con soporte offline

const CACHE_NAME = "red-agro-v1";
const STATIC_CACHE_NAME = "red-agro-static-v1";
const API_CACHE_NAME = "red-agro-api-v1";

// URLs que se cachearán estáticamente (recursos críticos)
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
  // Se añadirán los iconos cuando se generen
];

// URLs de API que se pueden cachear temporalmente
const CACHEABLE_API_PATTERNS = [
  "/api/posts",
  "/api/user/me",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");

  event.waitUntil(
    (async () => {
      try {
        // Crear caches
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        console.log("[SW] Cache estático creado");

        // Intentar cachear recursos estáticos críticos
        try {
          await staticCache.addAll(STATIC_ASSETS);
          console.log("[SW] Recursos estáticos cacheados");
        } catch (err) {
          console.warn("[SW] No se pudieron cachear todos los recursos estáticos:", err);
        }

        // Forzar activación inmediata
        await self.skipWaiting();
      } catch (err) {
        console.error("[SW] Error durante la instalación:", err);
      }
    })()
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando Service Worker...");

  event.waitUntil(
    (async () => {
      // Limpiar caches antiguos
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(
        (name) =>
          name !== STATIC_CACHE_NAME &&
          name !== API_CACHE_NAME &&
          name !== CACHE_NAME
      );

      await Promise.all(
        cachesToDelete.map((name) => {
          console.log("[SW] Eliminando cache antiguo:", name);
          return caches.delete(name);
        })
      );

      // Tomar control de todos los clientes inmediatamente
      await self.clients.claim();
      console.log("[SW] Service Worker activado y controlando clientes");
    })()
  );
});

// Estrategia de fetch: Network First con fallback a Cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests de extensión de Chrome/devtools
  if (
    !url.protocol.startsWith("http") ||
    url.hostname === "chrome-extension" ||
    url.hostname === "chrome"
  ) {
    return;
  }

  // Para recursos estáticos: Cache First con Network fallback
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Para API: Network First con Cache fallback
  if (url.pathname.startsWith("/api/")) {
    // Solo cachear GET requests de APIs permitidas
    if (
      request.method === "GET" &&
      CACHEABLE_API_PATTERNS.some((pattern) => url.pathname.startsWith(pattern))
    ) {
      event.respondWith(networkFirstAPI(request));
      return;
    }
    // Para otros métodos o endpoints, no cachear
    return;
  }

  // Para navegación: Network First con fallback a cache offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Para otros recursos: Network First
  event.respondWith(networkFirst(request));
});

// Estrategia: Cache First (para recursos estáticos)
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log("[SW] Cache HIT:", request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error("[SW] Error fetching:", request.url, error);
    // Para imágenes, retornar un placeholder
    if (request.destination === "image") {
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="#e5e7eb"/>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#6b7280" font-size="14">Sin conexión</text>
        </svg>`,
        { headers: { "Content-Type": "image/svg+xml" } }
      );
    }
    throw error;
  }
}

// Estrategia: Network First (para API)
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cachear respuesta por 5 minutos
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[SW] Network falló, buscando en cache:", request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Si no hay cache, retornar respuesta de error
    return new Response(
      JSON.stringify({
        error: "Sin conexión",
        message: "No hay conexión a internet. Mostrando datos guardados.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Estrategia: Network First con Offline Fallback (para navegación)
async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("[SW] Network falló, buscando en cache:", request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback a página offline
    const offlineResponse = await cache.match("/offline");
    if (offlineResponse) {
      return offlineResponse;
    }

    // Crear respuesta HTML básica offline
    return new Response(
      `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sin conexión - Red Agro</title>
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
          .container {
            text-align: center;
            color: white;
            max-width: 400px;
          }
          .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          h1 { font-size: 24px; margin-bottom: 10px; }
          p { color: #94a3b8; margin-bottom: 20px; line-height: 1.6; }
          button {
            background: #059669;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          }
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

// Estrategia genérica: Network First
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[SW] Network falló, buscando en cache:", request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Mensajes desde el cliente
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
