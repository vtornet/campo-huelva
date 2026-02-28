"use client";

import { useState, useEffect, useCallback } from "react";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPreferences {
  messages: boolean;
  applications: boolean;
  applicationStatus: boolean;
  newOffers: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  messages: true,
  applications: true,
  applicationStatus: true,
  newOffers: false,
};

export function usePushNotifications() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  // Cargar preferencias guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem("notificationPreferences");
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Error loading notification preferences:", e);
    }
  }, []);

  // Guardar preferencias
  const savePreferences = useCallback((newPrefs: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  }, [preferences]);

  // Verificar soporte para notificaciones
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("[Push] Push notifications no soportado");
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // Cargar suscripción existente
    navigator.serviceWorker.ready.then(async (registration) => {
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription.toJSON() as PushSubscription);
      }
    });
  }, []);

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async () => {
    if (!supported) return false;

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  // Suscribir a notificaciones push
  const subscribe = useCallback(async () => {
    if (!supported || permission !== "granted") {
      console.warn("[Push] Permiso no concedido o no soportado");
      return null;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      });

      const subscriptionJson = pushSubscription.toJSON() as PushSubscription;
      setSubscription(subscriptionJson);

      // Enviar suscripción al servidor
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscriptionJson,
          userId: localStorage.getItem("userId"), // Se obtendrá del auth context
        })
      });

      return subscriptionJson;
    } catch (error) {
      console.error("[Push] Error subscribing:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supported, permission]);

  // Desuscribir de notificaciones
  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }
      setSubscription(null);

      // Eliminar suscripción del servidor
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription
        })
      });

      return true;
    } catch (error) {
      console.error("[Push] Error unsubscribing:", error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription]);

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

  return {
    supported,
    permission,
    subscription,
    loading,
    preferences,
    requestPermission,
    subscribe,
    unsubscribe,
    savePreferences,
    isSubscribed: !!subscription,
  };
}
