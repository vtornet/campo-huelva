// src/app/offer/[id]/page.tsx
// Página de detalle de una oferta con recomendaciones de trabajadores para empresas

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/components/Notifications';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import RecommendedWorkers from '@/components/RecommendedWorkers';
import PostActions from '@/components/PostActions';

export default function OfferDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const offerId = params.id as string;

  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error && data.exists !== false) {
            setUserData(data);
          }
        })
        .catch((err) => console.error('Error verificando usuario:', err));
    }
  }, [user]);

  // Cargar estado de inscripción del usuario en esta oferta
  useEffect(() => {
    if (user && offer && userData?.role !== 'COMPANY') {
      fetch(`/api/applications?userId=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const app = data.find((a: any) => a.postId === offerId);
            if (app) {
              setApplicationStatus(app.status);
            }
          }
        })
        .catch((err) => console.error('Error loading application:', err));
    }
  }, [user, offer, offerId, userData]);

  // Cargar la oferta
  useEffect(() => {
    if (!offerId) return;

    const fetchOffer = async () => {
      setLoading(true);
      try {
        // Pasamos el currentUserId para verificar si el usuario dio like
        const url = user
          ? `/api/posts/${offerId}?currentUserId=${user.uid}`
          : `/api/posts/${offerId}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Error al cargar la oferta');
        }

        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setOffer(data);
        }
      } catch (err) {
        console.error('Error cargando oferta:', err);
        setError('Error al cargar la oferta');
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, user]);

  // Verificar autenticación
  useEffect(() => {
    if (!user && !loading) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error || 'No se pudo cargar la oferta'}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const isCompany = userData?.role === 'COMPANY';
  const isAdmin = userData?.role === 'ADMIN';
  const isOwner =
    (offer.companyId && userData?.profile?.id === offer.companyId) ||
    (offer.publisherId && user?.uid === offer.publisherId);
  const isDemand = offer.type === 'DEMAND';
  const isOffer = !isDemand;
  const isSharedOffer = offer.type === 'SHARED';

  // Función para inscribirse en una oferta
  const handleApply = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    // Las empresas no se inscriben
    if (isCompany) {
      showNotification({
        type: 'info',
        title: 'Acción no disponible',
        message: 'Las empresas no pueden inscribirse en ofertas.',
      });
      return;
    }

    // Si ya está inscrito, permitir retirarse
    if (applicationStatus && applicationStatus !== 'WITHDRAWN') {
      const confirmWithdraw = await confirm({
        title: '¿Retirar tu inscripción?',
        message: 'Ya estás inscrito en esta oferta. Si confirmas, dejarás de figurar como interesado.',
        type: 'warning',
      });
      if (!confirmWithdraw) return;

      setApplying(true);
      try {
        const res = await fetch(`/api/posts/${offer.id}/apply?userId=${user.uid}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setApplicationStatus(null);
          showNotification({
            type: 'success',
            title: 'Inscripción retirada',
            message: 'Ya no figurarás como interesado en esta oferta.',
          });
        } else {
          const data = await res.json();
          showNotification({
            type: 'error',
            title: 'No se pudo retirar',
            message: data.error || 'Inténtalo de nuevo.',
          });
        }
      } catch (error) {
        console.error('Error withdrawing:', error);
        showNotification({
          type: 'error',
          title: 'Error de conexión',
          message: 'Verifica tu internet e inténtalo de nuevo.',
        });
      } finally {
        setApplying(false);
      }
      return;
    }

    // Confirmar inscripción
    const confirmApply = await confirm({
      title: '¿Inscribirte en esta oferta?',
      message: `Al inscribirte en "${offer.title}", autorizas a la empresa a ver tus datos de contacto (teléfono y email).`,
      confirmText: 'Sí, inscribirme',
      type: 'success',
    });
    if (!confirmApply) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/posts/${offer.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (res.ok) {
        setApplicationStatus('PENDING');
        showNotification({
          type: 'success',
          title: '¡Inscripción correcta!',
          message: `Te has inscrito en "${offer.title}". La empresa podrá ver tu perfil.`,
        });
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'No se pudo completar la inscripción',
          message: data.error || 'Inténtalo de nuevo más tarde.',
        });
      }
    } catch (error) {
      console.error('Error applying:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setApplying(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const otherUserId = offer.company?.user?.id || offer.publisher?.id;
    if (!otherUserId) {
      showNotification({
        type: "error",
        title: "No se puede contactar",
        message: "Esta publicación no tiene un contacto válido.",
      });
      return;
    }

    if (otherUserId === user.uid) {
      showNotification({
        type: "warning",
        title: "¿Contactarte contigo mismo?",
        message: "No puedes enviar mensajes a tu propio usuario.",
      });
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: otherUserId,
          content: `Hola, me interesa tu publicación: ${offer.title}`,
          postId: offer.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/${locale}/messages/${data.conversationId}`);
      } else {
        showNotification({
          type: "error",
          title: "Error al iniciar conversación",
          message: "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error('Error contacting:', error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
    <main className="min-h-screen bg-slate-50">
      {/* Navbar simplificado */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push(`/${locale}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="font-semibold text-slate-800">
            {isDemand ? 'Detalle de la demanda' : 'Detalle de la oferta'}
          </h1>
          <div className="w-16"></div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        {/* === DETALLE DE LA OFERTA/DEMANDA === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 shadow-black/5">
          {/* Etiqueta de tipo */}
          <div className="flex justify-between items-start mb-4">
            <div>
              {offer.type === 'OFFICIAL' && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
                  Empresa verificada
                </span>
              )}
              {offer.type === 'SHARED' && (
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-full border border-slate-200">
                  Oferta compartida
                </span>
              )}
              {offer.type === 'DEMAND' && (
                <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-3 py-1 rounded-full border border-orange-200">
                  Demanda de empleo
                </span>
              )}
            </div>
            {isOwner && (
              <span className="text-xs text-slate-500">Tu publicación</span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">{offer.title}</h1>

          {/* Acciones sociales */}
          <div className="mb-3">
            <PostActions
              postId={offer.id}
              initialLiked={offer.liked || false}
              initialLikesCount={offer.likesCount || 0}
              initialSharesCount={offer.sharesCount || 0}
              isOwner={isOwner}
              type={offer.type}
              size="md"
            />
          </div>

          {/* Tipo de tarea para demandas */}
          {isDemand && offer.taskType && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1 text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {offer.taskType}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-600 mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{offer.location}{offer.province && `, ${offer.province}`}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <p className="text-slate-700 leading-relaxed">"{offer.description}"</p>
          </div>

          {/* === CONDICIONES LABORALES (Solo para ofertas) === */}
          {isOffer && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 mb-6">
              <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Condiciones laborales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipo de contrato */}
                {offer.contractType && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tipo de contrato</p>
                      <p className="font-medium text-slate-800">{offer.contractType}</p>
                    </div>
                  </div>
                )}

                {/* Salario */}
                {offer.salaryAmount && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Salario bruto</p>
                      <p className="font-medium text-slate-800">
                        {offer.salaryAmount}
                        {offer.salaryPeriod && (
                          <span className="text-sm font-normal text-slate-600">
                            /{offer.salaryPeriod === 'HORA' ? 'hora' : offer.salaryPeriod === 'JORNADA' ? 'jornada' : offer.salaryPeriod === 'MENSUAL' ? 'mes' : offer.salaryPeriod === 'ANUAL' ? 'año' : offer.salaryPeriod.toLowerCase()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Horas semanales */}
                {offer.hoursPerWeek && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Jornada</p>
                      <p className="font-medium text-slate-800">{offer.hoursPerWeek} horas/semana</p>
                    </div>
                  </div>
                )}

                {/* Alojamiento */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${offer.providesAccommodation ? 'bg-amber-100' : 'bg-slate-100'}`}>
                    <svg className={`w-5 h-5 ${offer.providesAccommodation ? 'text-amber-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Alojamiento</p>
                    <p className="font-medium text-slate-800">
                      {offer.providesAccommodation ? (
                        <span className="text-amber-600">Sí, incluido</span>
                      ) : (
                        <span className="text-slate-500">No incluido</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Fechas */}
                {(offer.startDate || offer.endDate) && (
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fechas</p>
                      <p className="font-medium text-slate-800">
                        {offer.startDate && `Desde ${formatDate(offer.startDate)}`}
                        {offer.startDate && offer.endDate && ' • '}
                        {offer.endDate && `hasta ${formatDate(offer.endDate)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información del autor */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              {offer.company?.profileImage || offer.publisher?.workerProfile?.profileImage || offer.publisher?.foremanProfile?.profileImage ? (
                <img
                  src={offer.company?.profileImage || offer.publisher?.workerProfile?.profileImage || offer.publisher?.foremanProfile?.profileImage}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                  isDemand ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                  offer.type === 'OFFICIAL' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {offer.company?.companyName?.[0] || offer.publisher?.workerProfile?.fullName?.[0] || offer.publisher?.foremanProfile?.fullName?.[0] || '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">
                  {offer.company?.companyName || offer.publisher?.workerProfile?.fullName || offer.publisher?.foremanProfile?.fullName || 'Usuario'}
                </p>
                <p className="text-sm text-slate-500">
                  {isDemand ? 'Candidato' : offer.type === 'OFFICIAL' ? 'Empresa' : 'Usuario de Red Agro'}
                </p>
              </div>
            </div>

            {!isOwner && !isSharedOffer && (
              <>
                {/* Para ofertas OFICIALES: botón de inscribirse (no para empresas) */}
                {isOffer && !isCompany && (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className={`text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm flex items-center gap-2 ${
                      applying
                        ? 'bg-slate-400 cursor-wait'
                        : applicationStatus
                          ? applicationStatus === 'ACCEPTED'
                            ? 'bg-green-500 hover:bg-green-600 shadow-green-500/25'
                            : applicationStatus === 'REJECTED'
                              ? 'bg-red-400 hover:bg-red-500 shadow-red-500/25'
                              : applicationStatus === 'CONTACTED'
                                ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25'
                                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/25'
                    }`}
                  >
                    {applying ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : applicationStatus ? (
                      applicationStatus === 'ACCEPTED' ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Aceptado
                        </>
                      ) : applicationStatus === 'REJECTED' ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No seleccionado
                        </>
                      ) : applicationStatus === 'CONTACTED' ? (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Contactado
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Inscrito
                        </>
                      )
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Inscribirse
                      </>
                    )}
                  </button>
                )}
                {/* Para demandas o empresas viendo ofertas: botón de contactar */}
                {(isDemand || isCompany) && (
                  <button
                    onClick={handleContact}
                    className={`text-white px-6 py-3 rounded-xl font-semibold hover:from-opacity-90 hover:to-opacity-90 transition-all duration-200 shadow-sm flex items-center gap-2 ${
                      isDemand
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-orange-500/25'
                        : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/25'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Contactar
                  </button>
                )}
              </>
            )}
            {/* Para ofertas compartidas: sin botón de acción */}
            {isSharedOffer && !isOwner && <div className="w-32"></div>}
          </div>
        </div>

        {/* === RECOMENDACIONES DE TRABAJADORES (Solo para empresas) === */}
        {isCompany && offer.type === 'OFFICIAL' && (
          <RecommendedWorkers
            postId={offerId}
            companyId={userData?.profile?.id}
          />
        )}

      </div>
    </main>
    <ConfirmDialogComponent />
    </>
  );
}
