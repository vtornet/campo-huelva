"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { Check, Crown, X, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

// Variable de entorno para controlar si los pagos Premium están habilitados
const PREMIUM_ENABLED = process.env.NEXT_PUBLIC_PREMIUM_ENABLED !== "false";

type SubscriptionStatus = {
  isPremium: boolean;
  subscription: {
    status: string;
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
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [purchasingOfferPack, setPurchasingOfferPack] = useState<string | null>(null);

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
        body: JSON.stringify({
          uid: user.uid,
          billingPeriod, // "monthly" o "yearly"
        }),
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
    // Redirigir a la pestaña de suscripción del perfil
    router.push("/profile?tab=suscripcion");
  }

  async function handleBuyOfferPack(pack: '1' | '5' | '10') {
    if (!user) return;

    setPurchasingOfferPack(pack);
    try {
      const response = await fetch("/api/stripe/create-offer-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          offerPack: pack,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Error al iniciar el proceso de pago");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "No se pudo iniciar el proceso de pago",
      });
    } finally {
      setPurchasingOfferPack(null);
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

        {/* Mensaje de bloqueo temporal de pagos */}
        {!PREMIUM_ENABLED && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0" />
              <h2 className="text-xl font-bold text-amber-900">
                Pagos temporalmente deshabilitados
              </h2>
            </div>
            <p className="text-amber-800 mb-4">
              Estamos construyendo nuestra base de datos de candidatos. Mientras tanto, puedes solicitar la publicación de una oferta gratuita completando tu perfil de empresa.
            </p>
            <div className="bg-white rounded-xl p-4 text-left">
              <h3 className="font-semibold text-amber-900 mb-2">¿Cómo solicitar una oferta gratuita?</h3>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside ml-4">
                <li>Completa tu perfil de empresa con tus datos</li>
                <li>Contacta con nosotros a través del formulario de contacto</li>
                <li>Solicita la publicación de una oferta gratuita</li>
              </ol>
            </div>
          </div>
        )}

        {isPremium ? (
          // Vista de suscriptor actual
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-8 text-white text-center">
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">
                ¡Eres Premium!
              </h2>
              <p className="text-yellow-100">
                Disfruta de todos los beneficios
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
                      <span>Badge "Empresa Premium" en tu perfil</span>
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
                        Activa
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
          // Vista de no suscriptor - mostrar pricing o mensaje de bloqueo
          <>
            {/* Planes de suscripción */}
            {PREMIUM_ENABLED ? (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  O elige un plan Premium para publicar ilimitado
                </h3>

                {/* Selector de periodo de facturación */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-6 py-2 rounded-lg font-medium transition ${
                      billingPeriod === "monthly"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`px-6 py-2 rounded-lg font-medium transition relative ${
                      billingPeriod === "yearly"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Anual
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      -20%
                    </span>
                  </button>
                </div>

                {/* Precios */}
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl font-bold text-gray-900">
                    {billingPeriod === "monthly" ? "99€" : "999€"}
                  </span>
                  <span className="text-gray-600">
                    /{billingPeriod === "monthly" ? "mes" : "año"}
                  </span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="text-green-600 font-medium">
                    Ahorras 189€ (2 meses gratis)
                  </p>
                )}
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
                    "Badge \"Empresa Premium\" que destaca tu perfil",
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
                    Suscribirse ahora
                  </>
                )}
              </button>
            </div>
          </div>
            ) : null}
          </>
        )}

        {/* Sección: Publicar ofertas sin suscripción */}
        {PREMIUM_ENABLED && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-8">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Publica ofertas sin suscripción
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Si solo necesitas publicar unas pocas ofertas al año, esta opción es para ti
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Pack 1 oferta */}
              <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">1 Oferta</h3>
                  <p className="text-3xl font-bold text-gray-900">29€</p>
                  <p className="text-sm text-gray-500">Válida 30 días</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Publicación por 30 días</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Visible en el feed principal</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4" />
                    <span>Sin acceso a buscador</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleBuyOfferPack('1')}
                  disabled={purchasingOfferPack !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasingOfferPack === '1' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Procesando...
                    </>
                  ) : (
                    "Comprar"
                  )}
                </button>
              </div>

              {/* Pack 5 ofertas */}
              <div className="border-2 border-blue-400 rounded-xl p-6 relative bg-blue-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                  Popular
                </div>
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Pack 5 Ofertas</h3>
                  <p className="text-3xl font-bold text-gray-900">120€</p>
                  <p className="text-sm text-green-600 font-medium">Ahorras 25€</p>
                  <p className="text-xs text-gray-500">24€ por oferta</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>5 publicaciones por 30 días</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Visibles en el feed principal</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4" />
                    <span>Sin acceso a buscador</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleBuyOfferPack('5')}
                  disabled={purchasingOfferPack !== null}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasingOfferPack === '5' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Procesando...
                    </>
                  ) : (
                    "Comprar pack"
                  )}
                </button>
              </div>

              {/* Pack 10 ofertas */}
              <div className="border-2 border-green-400 rounded-xl p-6 relative bg-green-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full">
                  Mejor valor
                </div>
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Pack 10 Ofertas</h3>
                  <p className="text-3xl font-bold text-gray-900">200€</p>
                  <p className="text-sm text-green-600 font-medium">Ahorras 90€</p>
                  <p className="text-xs text-gray-500">20€ por oferta</p>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>10 publicaciones por 30 días</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Visibles en el feed principal</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-500">
                    <X className="w-4 h-4" />
                    <span>Sin acceso a buscador</span>
                  </li>
                </ul>
                <button
                  onClick={() => handleBuyOfferPack('10')}
                  disabled={purchasingOfferPack !== null}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purchasingOfferPack === '10' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Procesando...
                    </>
                  ) : (
                    "Comprar pack"
                  )}
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              💡 Si necesitas publicar muchas ofertas, el plan Premium te sale más rentable
            </p>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
