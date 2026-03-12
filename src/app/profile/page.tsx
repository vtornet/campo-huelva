"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { usePromptDialog } from "@/components/PromptDialog";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
import { BackButton } from "@/components/BackButton";
import { formatPostDate } from "@/lib/utils";

type TabType = "profile" | "posts" | "contacts" | "settings" | "subscription";

// Componente de la pestaña de Suscripción
interface SubscriptionTabContentProps {
  subscriptionData: any;
  subscriptionLoading: boolean;
  user: any;
  showNotification: (notification: any) => void;
  confirm: (options: any) => Promise<boolean>;
  loadSubscription: () => void;
}

function SubscriptionTabContent({
  subscriptionData,
  subscriptionLoading,
  user,
  showNotification,
  confirm,
  loadSubscription,
}: SubscriptionTabContentProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleSkipTrial = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "STRIPE_NOT_CONFIGURED") {
          showNotification({
            type: "warning",
            title: "Sistema de pagos en mantenimiento",
            message: "El sistema de pagos está siendo configurado. Contacta con soporte.",
          });
          return;
        }
        throw new Error(error.message || error.error || "Error al iniciar el proceso");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "No se pudo iniciar el proceso de suscripción",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error === "STRIPE_NOT_CONFIGURED") {
          showNotification({
            type: "warning",
            title: "Sistema de pagos en mantenimiento",
            message: "El sistema de pagos está siendo configurado. Contacta con soporte.",
          });
          return;
        }
        throw new Error(error.message || error.error || "Error al iniciar el proceso");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "No se pudo iniciar el proceso de suscripción",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManageStripe = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!res.ok) {
        throw new Error("Error al acceder al portal de gestión");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo abrir el portal de gestión de Stripe",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = await confirm({
      title: "¿Cancelar suscripción?",
      message: "Tras cancelar, perderás acceso al buscador de candidatos al finalizar el periodo actual. ¿Deseas continuar?",
      confirmText: "Cancelar suscripción",
      cancelText: "Volver",
      type: "danger",
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al cancelar la suscripción");
      }

      showNotification({
        type: "success",
        title: "Suscripción cancelada",
        message: "Tu suscripción se ha cancelado correctamente. Seguirás teniendo acceso hasta el final del periodo actual.",
      });

      loadSubscription();
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "No se pudo cancelar la suscripción",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasSubscription = subscriptionData?.hasSubscription;
  const subscription = subscriptionData?.subscription;

  // Vista: Sin suscripción
  if (!hasSubscription || !subscription) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <svg className="w-16 h-16 mx-auto mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Suscríbete a Premium</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Accede al buscador de candidatos y disfruta de todos los beneficios Premium para potenciar tu contratación.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={handleSubscribe}
              disabled={processing}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <span>🎁</span>
                  Comenzar prueba gratis
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-4">7 días de prueba gratis, luego 99€/mes</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6">
          <h4 className="font-semibold text-slate-800 mb-4">Beneficios Premium</h4>
          <ul className="space-y-3">
            {["Publicación de ofertas ilimitadas", "Acceso completo al buscador de candidatos", 'Badge "Empresa Premium" en tu perfil', "Prioridad en resultados de búsqueda", "Soporte prioritario"].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Vista: En trial
  if (subscription.isTrial && subscription.status === "TRIALING") {
    const daysRemaining = subscription.daysRemainingInTrial || 0;
    const trialEndDate = subscription.trialEndsAt ? new Date(subscription.trialEndsAt).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) : "";

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🧪</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-900 mb-1">Periodo de prueba activo</h3>
              <p className="text-amber-700 text-sm mb-4">
                Tu prueba gratuita termina el <strong>{trialEndDate}</strong> ({daysRemaining} días restantes)
              </p>
              <div className="bg-white/70 rounded-lg p-3 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Beneficios activos durante la prueba:</strong>
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>✓ Publicación de ofertas ilimitadas</li>
                </ul>
                <p className="text-xs text-amber-600 mt-2 font-medium">
                  ⚠️ El buscador de candidatos estará disponible tras finalizar la prueba y suscribirte a Premium.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSkipTrial}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      Saltar prueba - 99€
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar prueba
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6">
          <h4 className="font-semibold text-slate-800 mb-2">📋 Información de suscripción</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Estado:</span>
              <span className="ml-2 font-medium text-amber-700">En prueba</span>
            </div>
            <div>
              <span className="text-slate-500">Fin de prueba:</span>
              <span className="ml-2 font-medium text-slate-800">{trialEndDate}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista: Suscripción activa
  if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
    const isTrial = subscription.isTrial;
    const statusText = isTrial ? "Prueba" : "Activa";
    const statusColor = isTrial ? "text-amber-700" : "text-green-700";
    const statusBg = isTrial ? "bg-amber-50" : "bg-green-50";

    const nextBillingDate = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Próximamente";

    return (
      <div className="space-y-6">
        <div className={`${statusBg} rounded-2xl p-6 border border-${isTrial ? "amber" : "green"}-200`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">👑</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {isTrial ? "🧪 Periodo de prueba" : "Suscripción Premium Activa"}
              </h3>
              <p className="text-slate-700 text-sm mb-4">
                Tu suscripción está {statusText.toLowerCase()}. Disfruta de todos los beneficios Premium.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Estado:</span>
                  <span className={`ml-2 font-medium ${statusColor}`}>{statusText}</span>
                </div>
                <div>
                  <span className="text-slate-500">Próxima renovación:</span>
                  <span className="ml-2 font-medium text-slate-800">{nextBillingDate}</span>
                </div>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-red-700">
                    ⚠️ Tu suscripción se cancelará al finalizar el periodo actual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6">
          <h4 className="font-semibold text-slate-800 mb-4">✅ Beneficios activos</h4>
          <ul className="space-y-3">
            {["Publicación de ofertas ilimitadas", isTrial ? "Buscador de candidatos (al finalizar prueba)" : "Acceso completo al buscador de candidatos", 'Badge "Empresa Premium" en tu perfil', "Prioridad en resultados de búsqueda", "Soporte prioritario"].map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {subscription.stripeCustomerId && (
            <button
              onClick={handleManageStripe}
              disabled={processing}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gestionar en Stripe
                </>
              )}
            </button>
          )}
          {!subscription.cancelAtPeriodEnd && (
            <button
              onClick={handleCancelSubscription}
              disabled={processing}
              className="px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
            >
              Cancelar suscripción
            </button>
          )}
        </div>
      </div>
    );
  }

  // Vista: Suscripción cancelada
  if (subscription.status === "CANCELED") {
    const periodEndDate = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

    return (
      <div className="space-y-6">
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">Suscripción cancelada</h3>
              <p className="text-red-700 text-sm">
                {periodEndDate
                  ? `Tu acceso a Premium finalizará el ${periodEndDate}.`
                  : "Tu suscripción ha sido cancelada."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <p className="text-slate-700 mb-4">¿Quieres volver a disfrutar de los beneficios Premium?</p>
          <button
            onClick={handleSubscribe}
            disabled={processing}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Procesando...
              </>
            ) : (
              <>
                <span>👑</span>
                Reactivar suscripción
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Vista: Otro estado
  return (
    <div className="bg-slate-50 rounded-xl p-6 text-center">
      <p className="text-slate-600">Estado de suscripción: {subscription.status}</p>
    </div>
  );
}

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Datos del usuario
  const [userData, setUserData] = useState<any>(null);

  // Datos de publicaciones
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [togglingClose, setTogglingClose] = useState<Record<string, boolean>>({});

  // Datos de contactos
  const [contacts, setContacts] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Datos de suscripción (solo para empresas)
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Estados para el modal de perfil de contacto
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // Cargar datos del usuario
  useEffect(() => {
    if (!authLoading && user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error && data.exists !== false) {
            setUserData(data);
            setPageLoading(false);
          }
        })
        .catch((err) => {
          console.error("Error cargando usuario:", err);
          setPageLoading(false);
        });
    } else if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Leer parámetro 'tab' de la URL para cambiar de pestaña
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "posts", "contacts", "messages", "settings", "subscription"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Cargar publicaciones del usuario cuando se cambia a la pestaña
  useEffect(() => {
    if (activeTab === "posts" && user) {
      loadUserPosts();
    }
  }, [activeTab, user]);

  // Cargar contactos cuando se cambia a la pestaña de contactos
  useEffect(() => {
    if (activeTab === "contacts" && user) {
      loadContacts();
    }
  }, [activeTab, user]);

  // Cargar suscripción cuando se cambia a la pestaña de suscripción
  useEffect(() => {
    if (activeTab === "subscription" && user) {
      loadSubscription();
    }
  }, [activeTab, user]);

  const loadUserPosts = async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      // Obtener posts normales (ofertas y demandas)
      const postsRes = await fetch(`/api/posts?userId=${user.uid}`);
      let allPosts: any[] = [];

      if (postsRes.ok) {
        const posts = await postsRes.json();
        allPosts = Array.isArray(posts) ? posts : [];
      }

      // Obtener posts del tablón
      const boardRes = await fetch(`/api/board?userId=${user.uid}`);
      if (boardRes.ok) {
        const boardPosts = await boardRes.json();
        if (Array.isArray(boardPosts)) {
          // Convertir posts del tablón al mismo formato que los posts normales
          const formattedBoardPosts = boardPosts.map((bp: any) => ({
            ...bp,
            type: 'BOARD', // Tipo especial para identificar posts del tablón
            title: bp.content?.substring(0, 60) + (bp.content?.length > 60 ? '...' : ''),
            description: bp.content,
            location: null,
            province: bp.author?.workerProfile?.province || bp.author?.foremanProfile?.province || null,
          }));
          allPosts = [...allPosts, ...formattedBoardPosts];
        }
      }

      // Ordenar por fecha de creación (más recientes primero)
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setUserPosts(allPosts);
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadContacts = async () => {
    if (!user) return;
    setContactsLoading(true);
    try {
      // Fetch contactos aceptados
      const contactsRes = await fetch(`/api/contacts?uid=${user.uid}`);
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data);
      }

      // Fetch solicitudes pendientes
      const requestsRes = await fetch(`/api/contacts?uid=${user.uid}&requests=true`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error cargando contactos:", error);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!user) return;
    setSubscriptionLoading(true);
    try {
      const res = await fetch(`/api/subscription?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error("Error cargando suscripción:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleAcceptRequest = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Aceptar solicitud",
      message: "¿Quieres añadir a esta persona como contacto? Podrán enviarse mensajes privados entre vosotros."
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "accept" })
      });

      if (res.ok) {
        showNotification({
          type: "success",
          title: "Contacto añadido",
          message: "Ahora podéis enviaros mensajes privados"
        });
        loadContacts();
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo aceptar la solicitud"
        });
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo aceptar la solicitud"
      });
    }
  };

  const handleRejectRequest = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Rechazar solicitud",
      message: "¿Seguro que quieres rechazar esta solicitud de contacto?"
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, action: "reject" })
      });

      if (res.ok) {
        showNotification({
          type: "info",
          title: "Solicitud rechazada",
          message: "La solicitud ha sido eliminada"
        });
        loadContacts();
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo rechazar la solicitud"
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Eliminar contacto",
      message: "¿Seguro que quieres eliminar a este contacto? Ya no podréis enviar mensajes privados."
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}?uid=${user.uid}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showNotification({
          type: "info",
          title: "Contacto eliminado",
          message: "El contacto ha sido eliminado de tu lista"
        });
        loadContacts();
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar el contacto"
      });
    }
  };

  const handleMessage = async (contactUserId: string) => {
    if (!user) return;

    try {
      const res = await fetch("/api/messages/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId1: user.uid,
          userId2: contactUserId,
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo crear la conversación"
        });
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo crear la conversación"
      });
    }
  };

  const handleViewProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/search/user-by-id?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProfile({ role: data.role, ...data.profile });
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo cargar el perfil"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  const profile = userData.profile;
  const role = userData.role;

  const handleEditBoardPost = async (postId: string, currentContent: string) => {
    const newContent = await prompt({
      title: "Editar publicación del tablón",
      message: "Modifica el contenido de tu publicación:",
      placeholder: "Escribe aquí...",
      defaultValue: currentContent,
      multiline: true,
      required: true,
    });

    if (!newContent || newContent === currentContent) return;

    // Validar longitud
    if (newContent.length > 2000) {
      showNotification({
        type: "error",
        title: "Contenido demasiado largo",
        message: "El contenido no puede exceder 2000 caracteres.",
      });
      return;
    }

    try {
      const res = await fetch(`/api/board-posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent, userId: user.uid }),
      });

      if (res.ok) {
        // Actualizar el post en la lista local
        setUserPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, description: newContent, title: newContent.substring(0, 60) + (newContent.length > 60 ? '...' : '') }
            : p
        ));
        showNotification({
          type: "success",
          title: "Publicación actualizada",
          message: "Tu publicación del tablón ha sido actualizada.",
        });
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "No se pudo actualizar",
          message: data.error || "Inténtalo de nuevo más tarde.",
        });
      }
    } catch {
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    }
  };

  const handleDeletePost = async (postId: string, isBoardPost = false) => {
    const confirmed = await confirm({
      title: "Eliminar publicación",
      message: "¿Eliminar esta publicación? Esta acción no se puede deshacer.",
      type: "danger",
    });
    if (!confirmed) return;

    // Usar endpoint diferente según el tipo de post
    const deleteUrl = isBoardPost
      ? `/api/board-posts/${postId}`
      : `/api/posts/${postId}?userId=${user.uid}&action=delete`;

    fetch(deleteUrl, { method: "DELETE" })
      .then(res => {
        if (res.ok) {
          setUserPosts(prev => prev.filter(p => p.id !== postId));
          showNotification({
            type: "success",
            title: "Publicación eliminada",
            message: "Tu publicación ha sido eliminada permanentemente.",
          });
        } else {
          showNotification({
            type: "error",
            title: "No se pudo eliminar",
            message: "Inténtalo de nuevo más tarde.",
          });
        }
      })
      .catch(() => {
        showNotification({
          type: "error",
          title: "Error de conexión",
          message: "Verifica tu internet e inténtalo de nuevo.",
        });
      });
  };

  const handleToggleClose = async (postId: string) => {
    if (!user) return;

    const post = userPosts.find(p => p.id === postId);
    if (!post || post.type !== 'OFFICIAL') return;

    setTogglingClose(prev => ({ ...prev, [postId]: true }));

    try {
      const action = post.isClosed ? 'reopen' : 'close';
      const res = await fetch(`/api/posts/${postId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          action
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Actualizar el estado local de la publicación
        setUserPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isClosed: !p.isClosed, closedAt: !p.isClosed ? new Date().toISOString() : null }
            : p
        ));
        showNotification({
          type: 'success',
          title: data.message,
          message: post.isClosed
            ? 'La oferta ya está disponible para recibir inscripciones.'
            : 'La oferta ya no recibirá nuevas inscripciones.',
        });
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'No se pudo actualizar',
          message: data.error || 'Inténtalo de nuevo.',
        });
      }
    } catch (error) {
      console.error('Error toggling close status:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setTogglingClose(prev => ({ ...prev, [postId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar simplificado */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <BackButton label="Inicio" />
            <div
              className="cursor-pointer transition-opacity hover:opacity-80"
              onClick={() => router.push("/")}
            >
              <Image
                src="/logo.png"
                alt="Agro Red"
                width={120}
                height={34}
                priority
              />
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all duration-200 font-medium"
          >
            Salir
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header con nombre y rol */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6 shadow-black/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Foto de perfil o avatar con inicial */}
              {profile?.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt="Foto de perfil"
                  className="w-16 h-16 rounded-full object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                  role === 'FOREMAN' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                  role === 'COMPANY' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                  role === 'ENGINEER' ? 'bg-gradient-to-br from-purple-400 to-purple-500' :
                  role === 'ENCARGADO' ? 'bg-gradient-to-br from-teal-400 to-teal-500' :
                  role === 'TRACTORISTA' ? 'bg-gradient-to-br from-amber-400 to-amber-500' :
                  'bg-gradient-to-br from-emerald-400 to-emerald-500'
                }`}>
                  {(profile?.fullName || profile?.companyName || user.email)?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-800">{profile?.fullName || profile?.companyName || "Usuario"}</h2>
                <p className="text-sm text-slate-500">
                  {role === 'FOREMAN' ? 'Manijero' :
                   role === 'COMPANY' ? 'Empresa' :
                   role === 'ENGINEER' ? 'Ingeniero Técnico Agrícola' :
                   role === 'ENCARGADO' ? 'Encargado/Capataz' :
                   role === 'TRACTORISTA' ? 'Tractorista' :
                   'Trabajador'}
                  {" · "}{user.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (role === 'COMPANY') router.push("/profile/company");
                else if (role === 'FOREMAN') router.push("/profile/foreman");
                else if (role === 'ENGINEER') router.push("/profile/engineer");
                else if (role === 'ENCARGADO') router.push("/profile/encargado");
                else if (role === 'TRACTORISTA') router.push("/profile/tractorista");
                else router.push("/profile/worker");
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar perfil
            </button>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 shadow-black/5">
          {/* Contenedor con scroll horizontal en móvil */}
          <div className="flex border-b border-slate-200/60 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-shrink-0 py-4 px-3 sm:px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "profile" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Perfil</span>
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-shrink-0 py-4 px-3 sm:px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "posts" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Mis Publicaciones</span>
              {userPosts.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {userPosts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-shrink-0 py-4 px-3 sm:px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "contacts" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Contactos</span>
              {pendingRequests.length > 0 && (
                <span className="ml-1 sm:ml-2 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-shrink-0 py-4 px-3 sm:px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "settings" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Ajustes</span>
            </button>
            {/* Pestaña de Suscripción - Solo para empresas */}
            {role === "COMPANY" && (
              <button
                onClick={() => setActiveTab("subscription")}
                className={`flex-shrink-0 py-4 px-3 sm:px-4 font-medium text-center transition-all duration-200 relative ${
                  activeTab === "subscription" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="hidden sm:inline">Suscripción</span>
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Tab Perfil */}
            {activeTab === "profile" && profile && (
              <div className="space-y-6">
                {/* Ubicación */}
                {profile.city || profile.province ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-slate-700">
                      {profile.city && `${profile.city}, `}{profile.province || "España"}
                    </span>
                  </div>
                ) : null}

                {/* Trabajador */}
                {role === 'USER' && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Cualificaciones</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.hasVehicle && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100/50">Coche propio</span>}
                      {profile.foodHandler && <span className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-sm font-medium border border-orange-100/50">Manipulador</span>}
                      {profile.phytosanitaryLevel && <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium border border-teal-100/50">Fitosanitario</span>}
                      {profile.canRelocate && <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-100/50">Disponible viajar</span>}
                    </div>
                    {profile.experience && profile.experience.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-slate-600 mb-2">Experiencia en cultivos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.experience.map((tag: string) => (
                            <span key={tag} className="bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full font-medium">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manijero */}
                {role === 'FOREMAN' && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Datos de Cuadrilla</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-orange-50/80 p-4 rounded-xl border border-orange-100/50 text-center">
                        <span className="block text-2xl font-bold text-orange-800">{profile.crewSize || 0}</span>
                        <span className="text-sm text-orange-600 font-medium">Personas</span>
                      </div>
                      <div className="bg-orange-50/80 p-4 rounded-xl border border-orange-100/50 text-center">
                        <span className="block text-2xl font-bold text-orange-800">{profile.yearsExperience || 0}</span>
                        <span className="text-sm text-orange-600 font-medium">Campañas</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.hasVan && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100/50">Furgonetas</span>}
                      {profile.ownTools && <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200">Herramientas</span>}
                      {profile.needsBus && <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-100/50">Necesita bus</span>}
                    </div>
                    {profile.specialties && profile.specialties.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-600 mb-2">Especialidades:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.specialties.map((tag: string) => (
                            <span key={tag} className="bg-orange-50 text-orange-800 text-sm px-3 py-1.5 rounded-full font-medium border border-orange-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingeniero */}
                {role === 'ENGINEER' && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Credenciales Profesionales</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100/50 text-center">
                        <span className="block text-2xl font-bold text-purple-800">{profile.yearsExperience || 0}</span>
                        <span className="text-sm text-purple-600 font-medium">Años de experiencia</span>
                      </div>
                      {profile.collegiateNumber && (
                        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100/50 text-center">
                          <span className="block text-lg font-bold text-purple-800">{profile.collegiateNumber}</span>
                          <span className="text-sm text-purple-600 font-medium">Nº Colegiado</span>
                        </div>
                      )}
                    </div>
                    {profile.canTravel !== undefined && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {profile.canTravel && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100/50">Disponible para desplazamientos</span>}
                        {profile.isAvailable && <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-100/50">Disponible para proyectos</span>}
                      </div>
                    )}
                    {profile.cropExperience && profile.cropExperience.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-600 mb-2">Experiencia en cultivos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.cropExperience.map((tag: string) => (
                            <span key={tag} className="bg-purple-50 text-purple-800 text-sm px-3 py-1.5 rounded-full font-medium border border-purple-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.specialties && profile.specialties.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-600 mb-2">Especialidades técnicas:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.specialties.map((tag: string) => (
                            <span key={tag} className="bg-indigo-50 text-indigo-800 text-sm px-3 py-1.5 rounded-full font-medium border border-indigo-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.servicesOffered && profile.servicesOffered.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-600 mb-2">Servicios ofrecidos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.servicesOffered.map((tag: string) => (
                            <span key={tag} className="bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full font-medium border border-slate-200">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Encargado/Capataz */}
                {role === 'ENCARGADO' && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Datos de Encargado</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-100/50 text-center">
                        <span className="block text-2xl font-bold text-teal-800">{profile.yearsExperience || 0}</span>
                        <span className="text-sm text-teal-600 font-medium">Años de experiencia</span>
                      </div>
                      {profile.canDriveTractor && (
                        <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-100/50 text-center">
                          <span className="text-2xl">🚜</span>
                          <span className="text-sm text-teal-600 font-medium block">Maneja tractor</span>
                        </div>
                      )}
                    </div>
                    {profile.needsAccommodation && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-sm font-medium border border-amber-100/50">Necesita alojamiento</span>
                      </div>
                    )}
                    {profile.cropExperience && profile.cropExperience.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-600 mb-2">Experiencia en cultivos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.cropExperience.map((tag: string) => (
                            <span key={tag} className="bg-teal-50 text-teal-800 text-sm px-3 py-1.5 rounded-full font-medium border border-teal-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.workArea && profile.workArea.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-slate-600 mb-2">Área de trabajo:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.workArea.map((tag: string) => (
                            <span key={tag} className="bg-slate-100 text-slate-700 text-sm px-3 py-1.5 rounded-full font-medium border border-slate-200">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tractorista */}
                {role === 'TRACTORISTA' && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Datos de Tractorista</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100/50 text-center">
                        <span className="block text-2xl font-bold text-amber-800">{profile.yearsExperience || 0}</span>
                        <span className="text-sm text-amber-600 font-medium">Años de experiencia</span>
                      </div>
                      <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-100/50 text-center">
                        <span className="block text-2xl font-bold text-amber-800">{profile.machineryTypes?.length || 0}</span>
                        <span className="text-sm text-amber-600 font-medium">Tipos de maquinaria</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {profile.hasTractorLicense && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100/50">Carnet tractor</span>}
                      {profile.hasSprayerLicense && <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-medium border border-teal-100/50">Carnet pulverizadora</span>}
                      {profile.hasHarvesterLicense && <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium border border-green-100/50">Carnet cosechadora</span>}
                      {profile.isAvailableSeason && <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-100/50">Temporada completa</span>}
                      {profile.canTravel && <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-100/50">Puede viajar</span>}
                    </div>
                    {profile.machineryTypes && profile.machineryTypes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-600 mb-2">Maquinaria:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.machineryTypes.map((tag: string) => (
                            <span key={tag} className="bg-amber-50 text-amber-800 text-sm px-3 py-1.5 rounded-full font-medium border border-amber-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.toolTypes && profile.toolTypes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-600 mb-2">Aperos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.toolTypes.map((tag: string) => (
                            <span key={tag} className="bg-orange-50 text-orange-800 text-sm px-3 py-1.5 rounded-full font-medium border border-orange-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.cropExperience && profile.cropExperience.length > 0 && (
                      <div>
                        <h4 className="font-medium text-slate-600 mb-2">Experiencia en cultivos:</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.cropExperience.map((tag: string) => (
                            <span key={tag} className="bg-amber-50 text-amber-800 text-sm px-3 py-1.5 rounded-full font-medium border border-amber-100/50">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empresa */}
                {role === 'COMPANY' && profile.cif && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                    <span className="font-medium text-slate-700">CIF:</span>
                    <span className="font-mono text-slate-800 bg-white px-3 py-1 rounded">{profile.cif}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab Publicaciones */}
            {activeTab === "posts" && (
              <div>
                {postsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No tienes publicaciones</h3>
                    <p className="text-slate-500 text-sm">Comienza publicando ofertas o demandas para que te encuentren.</p>
                    <button
                      onClick={() => router.push("/publish")}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200"
                    >
                      Crear publicación
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => {
                      const isBoardPost = post.type === 'BOARD';
                      return (
                        <div key={post.id} className={`bg-white p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                          post.type === "OFFICIAL" ? "border-emerald-200/80" :
                          post.type === "DEMAND" ? "border-orange-200/80" :
                          isBoardPost ? "border-blue-200/80" :
                          "border-slate-200/60"
                        }`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  post.type === "OFFICIAL" ? "bg-emerald-100 text-emerald-700" :
                                  post.type === "DEMAND" ? "bg-orange-100 text-orange-700" :
                                  isBoardPost ? "bg-blue-100 text-blue-700" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  {post.type === "OFFICIAL" ? "Oferta" :
                                   post.type === "DEMAND" ? "Demanda" :
                                   isBoardPost ? "Tablón" :
                                   "Compartida"}
                                </span>
                                {post.isClosed && (
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Cerrada
                                  </span>
                                )}
                                <span className="text-xs text-slate-500">{formatPostDate(post.createdAt)}</span>
                              </div>
                              <h4 className={`font-bold break-all ${
                                post.type === 'DEMAND' ? 'text-orange-900' :
                                isBoardPost ? 'text-blue-900' :
                                'text-slate-800'
                              }`}>
                                {isBoardPost ? (
                                  <span className="whitespace-pre-wrap">{post.description}</span>
                                ) : (
                                  post.title
                                )}
                              </h4>
                              {!isBoardPost && (
                                <p className="text-sm text-slate-600 mt-1">{post.location}{post.province && `, ${post.province}`}</p>
                              )}
                              {isBoardPost && post.province && (
                                <p className="text-sm text-slate-500 mt-1">
                                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {post.province}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap self-start sm:self-auto">
                              {isBoardPost ? (
                                <button
                                  onClick={() => handleEditBoardPost(post.id, post.description)}
                                  className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-sm font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                              ) : (
                                <button
                                  onClick={() => router.push(`/publish?edit=${post.id}`)}
                                  className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-sm font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                              )}
                              <button
                                onClick={() => handleDeletePost(post.id, isBoardPost)}
                                className="inline-flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                              </button>
                              {/* Botón Cerrar/Reabrir - Solo para ofertas OFICIALES de empresas */}
                              {!isBoardPost && post.type === 'OFFICIAL' && role === 'COMPANY' && (
                                <button
                                  onClick={() => handleToggleClose(post.id)}
                                  disabled={togglingClose[post.id]}
                                  className={`inline-flex items-center gap-1 px-3 py-2 border rounded-lg transition text-sm font-medium ${
                                    post.isClosed
                                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                      : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'
                                  } ${togglingClose[post.id] ? 'opacity-50 cursor-wait' : ''}`}
                                  title={post.isClosed ? 'Reabrir oferta' : 'Cerrar oferta'}
                                >
                                  {togglingClose[post.id] ? (
                                    <>
                                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    </>
                                  ) : post.isClosed ? (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                      Reabrir
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                      Cerrar
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab Contactos */}
            {activeTab === "contacts" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => setActiveTab("contacts")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === "contacts" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Mis contactos ({contacts.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("contacts")}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === "contacts" ? "bg-slate-100 text-slate-600" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Solicitudes ({pendingRequests.length})
                  </button>
                </div>

                {contactsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Solicitudes pendientes */}
                    {pendingRequests.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Solicitudes pendientes</h3>
                        <div className="space-y-3">
                          {pendingRequests.map((contact) => (
                            <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                {contact.profile?.profileImage ? (
                                  <img
                                    src={contact.profile.profileImage}
                                    alt={contact.profile.fullName || contact.profile.companyName || "Usuario"}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">👤</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">{contact.profile?.fullName || contact.profile?.companyName || "Usuario"}</h4>
                                <p className="text-sm text-slate-500">{contact.profile?.province || ""}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAcceptRequest(contact.id)}
                                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                                >
                                  Aceptar
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(contact.id)}
                                  className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm"
                                >
                                  Rechazar
                                </button>
                                <button
                                  onClick={() => handleViewProfile(contact.requester?.id)}
                                  disabled={profileLoading}
                                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Ver perfil"
                                >
                                  {profileLoading ? (
                                    <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-slate-600"></div>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contactos aceptados */}
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Mis contactos</h3>
                      {contacts.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                          <p className="text-slate-500">Aún no tienes contactos</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {contacts.map((contact) => (
                            <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                {contact.user?.profile?.profileImage ? (
                                  <img
                                    src={contact.user.profile.profileImage}
                                    alt={contact.user.profile.fullName || contact.user.profile.companyName || "Usuario"}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl">👤</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">{contact.user?.profile?.fullName || contact.user?.profile?.companyName || "Usuario"}</h4>
                                <p className="text-sm text-slate-500">{contact.user?.profile?.province || ""}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMessage(contact.user.id)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Enviar mensaje"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleViewProfile(contact.user?.id)}
                                  disabled={profileLoading}
                                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Ver perfil"
                                >
                                  {profileLoading ? (
                                    <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-slate-600"></div>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar contacto"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h1m-1 1l-3 3m5 4l-3 3" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Ajustes */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">Notificaciones</h3>
                  <p className="text-sm text-slate-500 mb-4">Configura cómo quieres recibir las notificaciones de la aplicación.</p>
                  <PushNotificationSettings />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-700 mb-3">Información de la cuenta</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-slate-700">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Rol:</span>
                      <span className="text-slate-700 capitalize">
                        {role === 'USER' ? 'Trabajador' :
                         role === 'FOREMAN' ? 'Manijero' :
                         role === 'ENGINEER' ? 'Ingeniero' :
                         role === 'COMPANY' ? 'Empresa' :
                         role === 'ENCARGADO' ? 'Encargado' :
                         role === 'TRACTORISTA' ? 'Tractorista' : role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      confirm({
                        title: "¿Cerrar sesión?",
                        message: "Deberás volver a iniciar sesión para acceder a tu cuenta.",
                        confirmText: "Cerrar",
                        cancelText: "Cancelar"
                      }).then(() => {
                        auth.signOut();
                        router.push("/login");
                      });
                    }}
                    className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}

            {/* Tab Suscripción - Solo para empresas */}
            {activeTab === "subscription" && role === "COMPANY" && (
              <SubscriptionTabContent
                subscriptionData={subscriptionData}
                subscriptionLoading={subscriptionLoading}
                user={user}
                showNotification={showNotification}
                confirm={confirm}
                loadSubscription={loadSubscription}
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmDialogComponent />
      <PromptDialogComponent />

      {/* Modal de Perfil de Contacto */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Perfil Completo</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Info básica */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
                  {selectedProfile.profileImage ? (
                    <img
                      src={selectedProfile.profileImage}
                      alt={selectedProfile.fullName || selectedProfile.companyName || "Usuario"}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {selectedProfile.fullName || selectedProfile.companyName || "Sin nombre"}
                  </h3>
                  {selectedProfile.province && (
                    <p className="text-sm text-slate-600">
                      {selectedProfile.city ? `${selectedProfile.city}, ` : ""}{selectedProfile.province}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {selectedProfile.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Sobre mí</h4>
                  <p className="text-slate-600">{selectedProfile.bio}</p>
                </div>
              )}

              {/* Experiencia en cultivos */}
              {(selectedProfile.experience?.length || selectedProfile.specialties?.length || selectedProfile.cropExperience?.length) ? (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Experiencia en cultivos</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProfile.experience || selectedProfile.specialties || selectedProfile.cropExperience || []).slice(0, 20).map((exp: string, i: number) => (
                      <span key={i} className="text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Detalles adicionales */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProfile.hasVehicle && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>🚗 Tiene vehículo</span>
                  </div>
                )}
                {selectedProfile.canRelocate && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>✈️ Dispuesto a relocarse</span>
                  </div>
                )}
                {selectedProfile.phytosanitaryLevel && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>🌿 Fitosanitario: {selectedProfile.phytosanitaryLevel}</span>
                  </div>
                )}
                {selectedProfile.foodHandler && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>🍎 Manipulador de alimentos</span>
                  </div>
                )}
                {selectedProfile.yearsExperience > 0 && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span>📅 {selectedProfile.yearsExperience} años de experiencia</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
