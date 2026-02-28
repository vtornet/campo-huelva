"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface NotificationPreferences {
  messages: boolean;
  applications: boolean;
  applicationStatus: boolean;
  newOffers: boolean;
}

export function PushNotificationSettings() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages: true,
    applications: true,
    applicationStatus: true,
    newOffers: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar estado y preferencias al montar
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Verificar soporte
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(isSupported);

    if (!isSupported) return;

    // Cargar permiso actual
    setPermission(Notification.permission);

    // Cargar preferencias guardadas
    try {
      const saved = localStorage.getItem("notificationPreferences");
      if (saved) {
        setPreferences({ ...preferences, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Error loading notification preferences:", e);
    }

    // Verificar si hay suscripción activa
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  // Solicitar permiso y suscribirse
  const requestPermissionAndSubscribe = async () => {
    if (!supported || !user) return;

    setLoading(true);

    try {
      // Solicitar permiso
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        return;
      }

      // Obtener VAPID public key
      const vapidResponse = await fetch("/api/push/subscribe");
      if (!vapidResponse.ok) {
        console.error("Error obteniendo VAPID key");
        return;
      }

      // Suscribirse
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      // Enviar suscripción al servidor
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: pushSubscription.toJSON(),
          userId: user.uid,
        })
      });

      setIsSubscribed(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error suscribiendo a notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // Desuscribirse
  const unsubscribe = async () => {
    setLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: subscription.toJSON() })
        });
      }

      setIsSubscribed(false);
      setPermission("default");
    } catch (error) {
      console.error("Error desuscribiendo:", error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar preferencias
  const savePreference = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  };

  // Helper para convertir VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!supported) {
    return (
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-2">Notificaciones Push</h3>
        <p className="text-sm text-slate-600">
          Tu navegador no soporta notificaciones push. Por favor, usa un navegador moderno como Chrome, Firefox o Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSubscribed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              )}
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Notificaciones Push</h3>
            <p className="text-xs text-slate-500">
              {isSubscribed ? "Activadas" : permission === "denied" ? "Bloqueadas" : "Desactivadas"}
            </p>
          </div>
        </div>

        {showSuccess && (
          <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Guardado
          </span>
        )}

        {!isSubscribed ? (
          <button
            onClick={requestPermissionAndSubscribe}
            disabled={loading || permission === "denied"}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Activando..." : permission === "denied" ? "Bloqueadas" : "Activar"}
          </button>
        ) : (
          <button
            onClick={unsubscribe}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Desactivando..." : "Desactivar"}
          </button>
        )}
      </div>

      {isSubscribed && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-3">Selecciona qué notificaciones quieres recibir:</p>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              Nuevos mensajes
            </span>
            <button
              onClick={() => savePreference("messages", !preferences.messages)}
              className={`relative w-11 h-6 rounded-full transition-colors ${preferences.messages ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.messages ? "translate-x-5" : ""}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              Nuevas inscripciones en mis ofertas
            </span>
            <button
              onClick={() => savePreference("applications", !preferences.applications)}
              className={`relative w-11 h-6 rounded-full transition-colors ${preferences.applications ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.applications ? "translate-x-5" : ""}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              Cambios de estado en mis inscripciones
            </span>
            <button
              onClick={() => savePreference("applicationStatus", !preferences.applicationStatus)}
              className={`relative w-11 h-6 rounded-full transition-colors ${preferences.applicationStatus ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.applicationStatus ? "translate-x-5" : ""}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
              Nuevas ofertas según mi perfil
            </span>
            <button
              onClick={() => savePreference("newOffers", !preferences.newOffers)}
              className={`relative w-11 h-6 rounded-full transition-colors ${preferences.newOffers ? "bg-emerald-600" : "bg-slate-300"}`}
            >
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.newOffers ? "translate-x-5" : ""}`} />
            </button>
          </label>
        </div>
      )}

      {permission === "denied" && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Has bloqueado las notificaciones. Para activarlas, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
          </p>
        </div>
      )}
    </div>
  );
}
