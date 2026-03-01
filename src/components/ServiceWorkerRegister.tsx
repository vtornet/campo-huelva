"use client";

import { useEffect } from "react";

/**
 * Registra el service worker manualmente.
 * Este componente debe montarse en el layout principal.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      // Registrar el service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log("[SW] Service Worker registrado:", registration);

          // Verificar si hay una versión esperando
          if (registration.waiting) {
            console.log("[SW] Nueva versión esperando");
          }

          // Escuchar actualizaciones
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log("[SW] Nuevo service worker instalando");
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[SW] Nueva versión disponible, recarga para actualizar");
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[SW] Error registrando service worker:", error);
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
