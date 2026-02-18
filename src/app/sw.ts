// TypeScript Service Worker entry point
// Este archivo será compilado y colocado en /public/sw.js por el build

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "red-agro-v1";
const STATIC_CACHE_NAME = "red-agro-static-v1";
const API_CACHE_NAME = "red-agro-api-v1";

// URLs que se cachearán estáticamente
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/logo.png",
];

// Instalación
self.addEventListener("install", (event: ExtendableEvent) => {
  console.log("[SW] Instalando Service Worker...");
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        console.log("[SW] Cache estático creado");
        try {
          await staticCache.addAll(STATIC_ASSETS);
          console.log("[SW] Recursos estáticos cacheados");
        } catch (err) {
          console.warn("[SW] No se pudieron cachear todos los recursos:", err);
        }
        await self.skipWaiting();
      } catch (err) {
        console.error("[SW] Error durante la instalación:", err);
      }
    })()
  );
});

// Activación
self.addEventListener("activate", (event: ExtendableEvent) => {
  console.log("[SW] Activando Service Worker...");
  event.waitUntil(
    (async () => {
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

      await self.clients.claim();
      console.log("[SW] Service Worker activado");
    })()
  );
});

// Fetch
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son http
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Ignorar extensiones y chrome
  if (
    url.hostname === "chrome-extension" ||
    url.hostname === "chrome"
  ) {
    return;
  }

  // Para imágenes y fuentes: Cache First
  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Para navegación: Network First con fallback offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Para otros: Network First
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(STATIC_CACHE_NAME);
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
    console.error("[SW] Error fetching:", request.url);
    throw error;
  }
}

async function networkFirstNavigation(request: Request): Promise<Response> {
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

    // Página offline básica
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
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📱</div>
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

async function networkFirst(request: Request): Promise<Response> {
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

// Mensajes
self.addEventListener("message", (event: ExtendableMessageEvent) => {
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

export {};
