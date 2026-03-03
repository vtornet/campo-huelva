// Service Worker mínimo para Agro Red
// Solo maneja notificaciones push, NO intercepta peticiones de red
// Esto evita problemas con Google Auth

console.log("[SW] Service Worker cargado (versión minimal)");

// ============================================
// INSTALL / ACTIVATE
// ============================================

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activando...");
  event.waitUntil(self.clients.claim());
});

// ============================================
// FETCH - NO INTERCEPTAR NADA
// ============================================
// NO interceptamos peticiones de red para evitar problemas con Google Auth
// Todas las peticiones pasan directamente al navegador

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification recibida");

  const data = event.data?.json();
  if (!data) return;

  const options = {
    body: data.body || "Tienes una nueva notificación de Agro Red",
    icon: "/logo.png",
    badge: "/logo.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "general",
    requireInteraction: data.requireInteraction || false,
    data: { url: data.url || "/" }
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
});
