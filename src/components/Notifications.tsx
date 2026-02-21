/**
 * Sistema de notificaciones personalizadas
 * Reemplaza los alert() del navegador con mensajes más amigables
 */

"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationsContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  notifications: Notification[];
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-eliminar después de la duración (por defecto 4 segundos)
    const duration = notification.duration ?? 4000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // Escuchar eventos globales para componentes que no usan el hook directamente
  useEffect(() => {
    const handleShowNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: NotificationType; title: string; message?: string; duration?: number }>;
      if (customEvent.detail) {
        showNotification(customEvent.detail);
      }
    };

    window.addEventListener('show-notification', handleShowNotification);
    return () => window.removeEventListener('show-notification', handleShowNotification);
  }, [showNotification]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationsContext.Provider value={{ showNotification, notifications }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationsContext.Provider>
  );
}

function NotificationContainer({
  notifications,
  onRemove
}: {
  notifications: Notification[];
  onRemove: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(notification => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationCard({
  notification,
  onRemove
}: {
  notification: Notification;
  onRemove: () => void;
}) {
  const styles = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "bg-emerald-100 text-emerald-600",
      title: "text-emerald-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "bg-red-100 text-red-600",
      title: "text-red-800",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-100 text-blue-600",
      title: "text-blue-800",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-800",
    },
  };

  const style = styles[notification.type];
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl shadow-lg p-4 pointer-events-auto animate-slideIn`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.icon} flex items-center justify-center`}>
          {icons[notification.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${style.title} text-sm`}>
            {notification.title}
          </p>
          {notification.message && (
            <p className="text-sm text-slate-700 mt-1">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Helper para mostrar notificaciones rápidamente desde componentes que no usan el hook
 */
export function notify(
  type: NotificationType,
  title: string,
  message?: string,
  duration?: number
) {
  // Disparar un evento personalizado que el contexto capturará
  window.dispatchEvent(new CustomEvent('show-notification', {
    detail: { type, title, message, duration }
  }));
}
