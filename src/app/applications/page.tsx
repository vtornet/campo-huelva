"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    workerProfile?: {
      fullName: string;
      phone: string;
      province: string;
      city: string;
      experience: string[];
      hasVehicle: boolean;
      canRelocate: boolean;
      yearsExperience: number;
      profileImage?: string;
    };
    foremanProfile?: {
      fullName: string;
      phone: string;
      province: string;
      city: string;
      crewSize: number;
      workArea: string[];
      hasVan: boolean;
      yearsExperience: number;
      profileImage?: string;
    };
  };
  post: {
    id: string;
    title: string;
    type: string;
  };
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // Cargar posts de la empresa
  useEffect(() => {
    if (user) {
      fetch(`/api/posts?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Filtrar solo las ofertas (no demandas)
            const offers = data.filter((p: any) => p.type !== 'DEMAND');
            setMyPosts(offers);
            if (offers.length > 0 && !selectedPost) {
              setSelectedPost(offers[0].id);
            }
          }
        })
        .catch(err => console.error("Error loading posts:", err));
    }
  }, [user]);

  // Cargar inscritos cuando se selecciona un post
  useEffect(() => {
    if (selectedPost && user) {
      setLoadingApps(true);
      fetch(`/api/posts/${selectedPost}/apply?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setApplications(data);
          } else {
            setApplications([]);
          }
        })
        .catch(err => {
          console.error("Error loading applications:", err);
          setApplications([]);
        })
        .finally(() => setLoadingApps(false));
    }
  }, [selectedPost, user]);

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    if (!user) return;
    setUpdating(prev => ({ ...prev, [applicationId]: true }));
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          status: newStatus
        })
      });

      if (res.ok) {
        // Actualizar estado local
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Error al actualizar estado");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar estado");
    } finally {
      setUpdating(prev => ({ ...prev, [applicationId]: false }));
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
      case "REJECTED": return "Rechazado";
      case "CONTACTED": return "Contactado";
      case "PENDING": return "Pendiente";
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <h1 className="text-xl font-bold text-slate-800">Gestión de Candidatos</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Selector de oferta */}
        {myPosts.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Selecciona una oferta
            </label>
            <select
              value={selectedPost || ""}
              onChange={(e) => setSelectedPost(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {myPosts.map(post => (
                <option key={post.id} value={post.id}>
                  {post.title} ({post.location})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lista de candidatos */}
        {loadingApps ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin candidatos</h3>
            <p className="text-slate-500 text-sm">
              Aún no hay inscritos en esta oferta.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const profile = app.user.workerProfile || app.user.foremanProfile;
              const isWorker = !!app.user.workerProfile;
              const isForeman = !!app.user.foremanProfile;

              return (
                <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar */}
                    {profile?.profileImage ? (
                      <img
                        src={profile.profileImage}
                        alt="Avatar"
                        className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm ${
                        isForeman ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
                      }`}>
                        {profile?.fullName?.[0] || "?"}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 text-lg">
                            {profile?.fullName || "Usuario"}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isForeman ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isForeman ? 'Jefe de cuadrilla' : isWorker ? 'Trabajador' : app.user.role}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(app.status)}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      {/* Detalles según tipo */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {profile?.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {profile.phone}
                          </div>
                        )}
                        {profile?.province && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {profile.city ? `${profile.city}, ` : ""}{profile.province}
                          </div>
                        )}
                        {isWorker && profile && 'experience' in profile && profile.experience && profile.experience.length > 0 && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {(profile as any).experience.slice(0, 2).join(", ")}
                            {(profile as any).experience.length > 2 && "..."}
                          </div>
                        )}
                        {isForeman && profile && 'crewSize' in profile && profile.crewSize && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Cuadrilla de {(profile as any).crewSize} personas
                          </div>
                        )}
                        {profile?.yearsExperience && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {profile.yearsExperience} años de experiencia
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 md:flex-col">
                      {app.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                            disabled={updating[app.id]}
                            className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "CONTACTED")}
                            disabled={updating[app.id]}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contactado
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                            disabled={updating[app.id]}
                            className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Descartar
                          </button>
                        </>
                      )}
                      {app.status === "ACCEPTED" && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, "CONTACTED")}
                          disabled={updating[app.id]}
                          className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Marcar contactado
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
    </main>
  );
}
// Thu, Feb 19, 2026  3:40:55 PM
