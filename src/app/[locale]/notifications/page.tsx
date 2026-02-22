"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  relatedPost?: {
    id: string;
    title: string;
    type: string;
    province?: string;
    location?: string;
  };
  relatedUser?: {
    id: string;
    email: string;
    role: string;
    workerProfile?: { fullName?: string };
    foremanProfile?: { fullName?: string };
    companyProfile?: { companyName?: string };
  };
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    if (!user) return;

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, notificationIds })
      });

      // Actualizar estado local
      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error("Error marcando como leído:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, markAll: true })
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    } else if (notification.relatedPost) {
      router.push(`/`);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, { icon: string; bg: string }> = {
      NEW_MESSAGE: { icon: "message", bg: "bg-blue-100 text-blue-600" },
      NEW_APPLICATION: { icon: "document", bg: "bg-emerald-100 text-emerald-600" },
      APPLICATION_ACCEPTED: { icon: "check", bg: "bg-emerald-100 text-emerald-600" },
      POST_NEARBY: { icon: "location", bg: "bg-orange-100 text-orange-600" },
      PROFILE_VIEW: { icon: "eye", bg: "bg-purple-100 text-purple-600" },
      COMPANY_VERIFIED: { icon: "building", bg: "bg-teal-100 text-teal-600" },
      ADMIN_ACTION: { icon: "shield", bg: "bg-red-100 text-red-600" }
    };

    const defaultIcon = { icon: "bell", bg: "bg-slate-100 text-slate-600" };
    const { icon, bg } = icons[type] || defaultIcon;

    const svgIcons: Record<string, string> = {
      message: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      document: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
      building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    };

    return (
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={svgIcons[icon] || svgIcons.bell} />
        </svg>
      </div>
    );
  };

  const getRelatedUserName = (notification: Notification) => {
    if (!notification.relatedUser) return null;
    const { relatedUser } = notification;
    if (relatedUser.workerProfile?.fullName) return relatedUser.workerProfile.fullName;
    if (relatedUser.foremanProfile?.fullName) return relatedUser.foremanProfile.fullName;
    if (relatedUser.companyProfile?.companyName) return relatedUser.companyProfile.companyName;
    return relatedUser.email.split("@")[0];
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Notificaciones</h1>
              {unreadCount > 0 && (
                <p className="text-xs text-emerald-600 font-medium">{unreadCount} nueva{unreadCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors px-3 py-2 rounded-xl hover:bg-emerald-50"
              >
                Marcar todas como leídas
              </button>
            )}
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-slate-600 hover:text-slate-800 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              No tienes notificaciones
            </h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Las notificaciones de nuevas ofertas, mensajes y más aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full rounded-2xl p-4 border transition-all duration-200 text-left hover:scale-[1.01] hover:shadow-md shadow-black/5 ${
                  notification.isRead
                    ? "bg-white border-slate-200/60 opacity-70"
                    : "bg-white border-emerald-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icono */}
                  {getNotificationIcon(notification.type)}

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold tracking-tight ${notification.isRead ? "text-slate-600" : "text-slate-800"}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
                        {new Date(notification.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <p className={`text-sm mb-2 ${notification.isRead ? "text-slate-500" : "text-slate-700"}`}>
                      {notification.message}
                    </p>

                    {/* Info adicional relacionada */}
                    {notification.relatedPost && (
                      <div className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1 font-medium border border-indigo-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {notification.relatedPost.title}
                        {notification.relatedPost.province && ` (${notification.relatedPost.province})`}
                      </div>
                    )}

                    {notification.relatedUser && (
                      <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Por: {getRelatedUserName(notification)}
                      </div>
                    )}
                  </div>

                  {/* Indicador de no leído */}
                  {!notification.isRead && (
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2 shadow-sm shadow-emerald-500/30"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
