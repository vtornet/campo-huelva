"use client";

import { useEffect } from "react";

export default function ServiceWorkerProvider() {
  useEffect(() => {
    // El registro del service worker lo maneja next-pwa automáticamente
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NEXT_PUBLIC_ENABLE_PWA === "true"
    ) {
      // Escuchar cuando se instala una nueva versión
      navigator.serviceWorker.ready.then((registration) => {
        console.log("[SW] Service Worker está listo:", registration);

        // Escuchar actualizaciones
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[SW] Nueva versión disponible");
                // Mostrar notificación o recargar
                if (confirm("Hay una nueva versión disponible. ¿Recargar ahora?")) {
                  window.location.reload();
                }
              }
            });
          }
        });
      });

      // Escuchar cuando el service worker toma control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[SW] Nuevo service worker activo");
        window.location.reload();
      });
    }
  }, []);

  return null;
}
