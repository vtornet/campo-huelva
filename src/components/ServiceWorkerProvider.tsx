"use client";

import { useEffect, useState } from "react";
import { useConfirmDialog } from "@/components/ConfirmDialog";

export default function ServiceWorkerProvider() {
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
                setUpdateAvailable(true);
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

  useEffect(() => {
    if (updateAvailable) {
      confirm({
        title: "Nueva versión disponible",
        message: "Hay una nueva versión de la aplicación. ¿Recargar ahora?",
        type: "info",
      }).then((confirmed) => {
        if (confirmed) {
          window.location.reload();
        }
        setUpdateAvailable(false);
      });
    }
  }, [updateAvailable, confirm]);

  return <ConfirmDialogComponent />;
}
