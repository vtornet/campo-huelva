"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "@/components/ConfirmDialog";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    description: string;
    location: string;
    province?: string;
    type: string;
    company?: {
      id: string;
      companyName: string;
      profileImage?: string;
    };
  };
}

export default function MyApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetch(`/api/applications?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setApplications(data);
          }
        })
        .catch(err => console.error("Error loading applications:", err))
        .finally(() => setLoadingApps(false));
    }
  }, [user]);

  const handleWithdraw = async (postId: string) => {
    const confirmed = await confirm({
      title: "Retirar inscripción",
      message: "¿Estás seguro de que quieres retirar tu inscripción?",
      type: "warning",
    });
    if (!confirmed) return;
    if (!user) return;

    setWithdrawing(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/apply?userId=${user.uid}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setApplications(prev => prev.filter(app => app.post.id !== postId));
        showNotification({
          type: "success",
          title: "Inscripción retirada",
          message: "Ya no figurarás como interesado en esta oferta.",
        });
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "No se pudo retirar",
          message: data.error || "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      setWithdrawing(prev => ({ ...prev, [postId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED": return "bg-red-100 text-red-800 border-red-200";
      case "CONTACTED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "Aceptado";
      case "REJECTED": return "No seleccionado";
      case "CONTACTED": return "Contactado";
      case "PENDING": return "Pendiente de revisión";
      default: return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "ACCEPTED": return "La empresa está interesada en tu perfil";
      case "REJECTED": return "La empresa ha decidido no continuar con tu candidatura";
      case "CONTACTED": return "La empresa te ha contactado";
      case "PENDING": return "Tu candidatura está siendo revisada por la empresa";
      default: return "";
    }
  };

  return (
    <>
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/${locale}`)}
              className="text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className="text-xl font-bold text-slate-800">Mis Inscripciones</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {loadingApps ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin inscripciones</h3>
            <p className="text-slate-500 text-sm mb-4">
              Aún no te has inscrito a ninguna oferta.
            </p>
            <button
              onClick={() => router.push(`/${locale}`)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-all font-medium"
            >
              Buscar ofertas
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-emerald-800">
                    <strong>Consejo:</strong> Las empresas revisan las candidaturas y te notificarán cuando haya novedades. Mientras tanto, sigue aplicando a más ofertas.
                  </p>
                </div>
              </div>
            </div>

            {applications.map(app => (
              <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Estado */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                      <span className="text-xs text-slate-500">
                        Inscrito el {new Date(app.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    {/* Empresa */}
                    <div className="flex items-center gap-2 mb-2">
                      {app.post.company?.profileImage ? (
                        <img
                          src={app.post.company.profileImage}
                          alt="Logo"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                          {app.post.company?.companyName?.[0] || "?"}
                        </div>
                      )}
                      <span className="text-sm text-slate-600">
                        {app.post.company?.companyName || "Empresa"}
                      </span>
                    </div>

                    {/* Título y descripción */}
                    <h3 className="font-semibold text-slate-800 text-lg mb-2">
                      {app.post.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {app.post.description}
                    </p>

                    {/* Ubicación */}
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {app.post.location}{app.post.province && `, ${app.post.province}`}
                    </div>

                    {/* Descripción del estado */}
                    {getStatusDescription(app.status) && (
                      <div className={`mt-3 p-3 rounded-lg text-sm ${getStatusColor(app.status)}`}>
                        {getStatusDescription(app.status)}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {app.status === "PENDING" && (
                    <button
                      onClick={() => handleWithdraw(app.post.id)}
                      disabled={withdrawing[app.post.id]}
                      className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {withdrawing[app.post.id] ? "Retirando..." : "Retirar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
    <ConfirmDialogComponent />
    </>
  );
}
