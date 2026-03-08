"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { Check, Crown, X, Loader2 } from "lucide-react";

type SubscriptionStatus = {
  isPremium: boolean;
  isTrial: boolean;
  subscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
};

export default function PremiumPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showNotification } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [stripeConfig, setStripeConfig] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Flag para evitar procesar múltiples veces los parámetros de URL
  const paramsProcessed = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !paramsProcessed.current) {
      // Leer parámetros una sola vez
      const success = searchParams.get("success");
      const canceled = searchParams.get("canceled");
      const sessionId = searchParams.get("session_id");

      if (success === "true" && sessionId) {
        paramsProcessed.current = true;

        // Mostrar notificación
        showNotification({
          type: "success",
          title: "¡Suscripción activada!",
          message: "Bienvenido al plan Premium. Ahora puedes publicar ofertas ilimitadas y acceder al buscador de candidatos.",
        });

        // Limpiar la URL inmediatamente
        router.replace("/premium", { scroll: false });

        // Redirigir a home después de mostrar notificación
        setTimeout(() => {
          router.push("/");
        }, 2000);

        return;
      }

      if (canceled === "true") {
        paramsProcessed.current = true;
        router.replace("/premium", { scroll: false });
        showNotification({
          type: "info",
          title: "Pago cancelado",
          message: "Puedes suscribirte en cualquier momento desde esta página.",
        });
        return;
      }

      // Si no hay parámetros especiales, cargar datos normales
      loadData();
    }
  }, [user, authLoading, searchParams]);

  async function loadData() {
    if (!user?.uid) return;
    try {
      setLoading(true);

      // Cargar datos del usuario (para obtener el rol)
      const userResponse = await fetch(`/api/user/me?uid=${user.uid}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserRole(userData.role);
      }

      // Cargar estado de suscripción
      const subResponse = await fetch(`/api/subscription/status?userId=${user.uid}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscriptionStatus(subData);
      }

      // Cargar configuración de Stripe
      const configResponse = await fetch("/api/stripe/config");
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setStripeConfig(configData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe() {
    if (!user) return;

    setCheckingOut(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!response.ok) {
        const error = await response.json();

        // Manejo específico para Stripe no configurado
        if (error.error === "STRIPE_NOT_CONFIGURED") {
          showNotification({
            type: "warning",
            title: "Sistema de pagos en mantenimiento",
            message: "El sistema de pagos está siendo configurado. Contacta con soporte para suscribirte.",
          });
          return;
        }

        throw new Error(error.message || error.error || "Error al iniciar el proceso de suscripción");
      }

      const { url } = await response.json();
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
      setCheckingOut(false);
    }
  }

  async function handleManageSubscription() {
    if (!user) return;
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!response.ok) {
        throw new Error("Error al acceder al portal de gestión");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo abrir el portal de gestión",
      });
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Verificar si el usuario es empresa
  if (userRole !== "COMPANY") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Suscripción no disponible
          </h1>
          <p className="text-gray-600">
            El plan Premium está disponible solo para empresas. Si tienes una empresa,
            primero completa tu perfil.
          </p>
        </div>
      </div>
    );
  }

  const isPremium = subscriptionStatus?.isPremium;
  const isTrial = subscriptionStatus?.isTrial;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Agro Red Premium
          </h1>
          <p className="text-lg text-gray-600">
            Potencia tu contratación con todas las ventajas
          </p>
        </div>

        {isPremium ? (
          // Vista de suscriptor actual
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-8 text-white text-center">
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">
                ¡Eres Premium{isTrial ? " (Prueba)" : ""}!
              </h2>
              <p className="text-yellow-100">
                {isTrial
                  ? `Tu prueba gratuita termina el ${
                      subscriptionStatus?.subscription?.trialEndsAt
                        ? new Date(
                            subscriptionStatus.subscription.trialEndsAt
                          ).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "pronto"
                    }`
                  : "Disfruta de todos los beneficios"}
              </p>
            </div>

            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-4">
                    ✅ Beneficios activos
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-green-800">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Publicación de ofertas ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-2 text-green-800">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Acceso completo al buscador de candidatos</span>
                    </li>
                    <li className="flex items-start gap-2 text-green-800">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Badge &quot;Empresa Premium&quot; en tu perfil</span>
                    </li>
                    <li className="flex items-start gap-2 text-green-800">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>Prioridad en resultados de búsqueda</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-4">
                    ℹ️ Información de la suscripción
                  </h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-600">Estado</dt>
                      <dd className="font-medium text-blue-900 capitalize">
                        {subscriptionStatus?.subscription?.status === "TRIALING"
                          ? "En prueba"
                          : "Activa"}
                      </dd>
                    </div>
                    {subscriptionStatus?.subscription?.currentPeriodEnd && (
                      <div>
                        <dt className="text-gray-600">Próxima renovación</dt>
                        <dd className="font-medium text-blue-900">
                          {new Date(
                            subscriptionStatus.subscription.currentPeriodEnd
                          ).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                    )}
                    {subscriptionStatus?.subscription?.cancelAtPeriodEnd && (
                      <div className="bg-yellow-100 border border-yellow-300 rounded px-3 py-2">
                        <p className="text-yellow-800 text-sm">
                          Tu suscripción se cancelará al finalizar el periodo.
                        </p>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleManageSubscription}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Gestionar suscripción
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
                >
                  Volver al perfil
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Vista de no suscriptor - mostrar pricing
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <span>🎁</span>
                  <span>7 días de prueba gratis</span>
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-gray-900">99€</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <p className="text-gray-600">
                  O 999€/año (ahorras 2 meses)
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Cancela cuando quieras. Sin compromisos.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 text-center">
                  Todo lo que incluye:
                </h3>
                <ul className="space-y-4">
                  {[
                    "Publicación de ofertas ilimitadas",
                    "Acceso completo al buscador de candidatos con filtros avanzados",
                    "Badge &quot;Empresa Premium&quot; que destaca tu perfil",
                    "Prioridad en los resultados de búsqueda",
                    "Soporte prioritario via email y chat",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleSubscribe}
                disabled={checkingOut}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Comenzar prueba gratis
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                No se cobrará nada hasta finalices la prueba de 7 días
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
