'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from './Notifications';

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

/**
 * Componente que gestiona las notificaciones push
 * Debe usarse dentro del AuthProvider para tener acceso al usuario
 */
export function PushNotificationManager() {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar preferencias guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Mezclarar con defaults para asegurar que todas las propiedades existan
        localStorage.setItem('notificationPreferences', JSON.stringify({ ...DEFAULT_PREFERENCES, ...parsed }));
      }
    } catch (e) {
      console.error('Error loading notification preferences:', e);
    }
  }, []);

  // Verificar soporte para notificaciones
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[Push] Push notifications no soportado');
      return;
    }

    setSupported(true);
    setPermission(Notification.permission);

    // Cargar suscripción existente
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription.toJSON() as PushSubscription);
          console.log('[Push] Suscripción existente encontrada');
        }
      } catch (error) {
        console.error('[Push] Error cargando suscripción existente:', error);
      }
    });
  }, []);

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async () => {
    if (!supported) return false;

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Suscribir automáticamente después de conceder permiso
        await subscribe();
      }

      return perm === 'granted';
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supported]);

  // Suscribir a notificaciones push
  const subscribe = useCallback(async () => {
    if (!user || !supported || permission !== 'granted') {
      console.warn('[Push] No se puede suscribir: usuario no autenticado, no soportado o permiso no concedido');
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

      // Enviar suscripción al servidor con el UID de Firebase
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscriptionJson,
          userId: user.uid, // Usar el UID de Firebase
        })
      });

      if (res.ok) {
        showNotification({
          type: 'success',
          title: 'Notificaciones activadas',
          message: 'Recibirás notificaciones de Agro Red.',
        });
        console.log('[Push] ✓ Suscripción enviada al servidor');
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'Error al suscribir',
          message: data.error || 'No se pudo guardar la suscripción.',
        });
      }

      return subscriptionJson;
    } catch (error: any) {
      console.error('[Push] Error subscribing:', error);

      // Si el error es de permiso denegado, mostrar mensaje específico
      if (error.name === 'NotAllowedError' || error.code === 1) {
        showNotification({
          type: 'warning',
          title: 'Permisos denegados',
          message: 'Las notificaciones están bloqueadas. Actívalas en la configuración de tu navegador.',
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Error al suscribir',
          message: 'No se pudo activar las notificaciones.',
        });
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [user, supported, permission, showNotification]);

  // Desuscribir de notificaciones push
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
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription
        })
      });

      showNotification({
        type: 'info',
        title: 'Notificaciones desactivadas',
        message: 'Ya no recibirás notificaciones push.',
      });

      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription, showNotification]);

  // Helper para convertir VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Este componente no renderiza nada visible
  return null;
}
