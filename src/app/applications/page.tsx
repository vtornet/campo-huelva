"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Application {
  id: string;
  status: string;
  createdAt: string;
  contactPermission?: boolean | null;
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
      bio?: string;
      machineryExperience?: string[];
      licenseTypes?: string[];
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
      bio?: string;
    };
  };
  post: {
    id: string;
    title: string;
    type: string;
  };
}

interface UserProfileModal {
  user: Application['user'];
  onClose: () => void;
}

// Componente modal para ver perfil completo
function UserProfileModal({ user, onClose }: UserProfileModal) {
  const profile = user.workerProfile || user.foremanProfile;
  const isWorker = !!user.workerProfile;
  const isForeman = !!user.foremanProfile;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover shadow-lg border-2 border-white"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                isForeman ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
              }`}>
                {profile?.fullName?.[0] || "?"}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{profile?.fullName || "Usuario"}</h2>
              <p className={`text-sm font-medium ${
                isForeman ? 'text-orange-600' : 'text-emerald-600'
              }`}>
                {isForeman ? 'Jefe de cuadrilla' : 'Trabajador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información de contacto visible solo con permiso */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Información de contacto
          </h3>
          {profile?.phone ? (
            <div className="flex items-center gap-2 text-slate-700 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {profile.phone}
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">No disponible</p>
          )}
          <p className="text-xs text-slate-500 mt-2">Email: {user.email}</p>
        </div>

        {/* Ubicación */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-2">Ubicación</h3>
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {profile?.city && `${profile.city}, `}{profile?.province || "No especificada"}
          </div>
        </div>

        {/* Experiencia */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-2">Experiencia</h3>
          <div className="flex items-center gap-2 text-slate-600 mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {profile?.yearsExperience || 0} años de experiencia
          </div>
          {isWorker && profile && 'experience' in profile && (profile as any).experience && (profile as any).experience.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(profile as any).experience.map((exp: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                  {exp}
                </span>
              ))}
            </div>
          )}
          {isForeman && profile && 'workArea' in profile && (profile as any).workArea && (profile as any).workArea.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(profile as any).workArea.map((area: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {area}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Detalles específicos */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-2">Detalles</h3>
          <div className="grid grid-cols-2 gap-3">
            {isWorker && (
              <>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    {(profile as any)?.hasVehicle ? "Tiene vehículo" : "Sin vehículo"}
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    {(profile as any)?.canRelocate ? "Puede relocarse" : "No relocación"}
                  </span>
                </div>
              </>
            )}
            {isForeman && (
              <>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    Cuadrilla de {(profile as any)?.crewSize || 0} personas
                  </span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    {(profile as any)?.hasVan ? "Tiene furgoneta" : "Sin furgoneta"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-2">Sobre mí</h3>
            <p className="text-slate-600 bg-slate-50 p-4 rounded-xl">{profile.bio}</p>
          </div>
        )}

        {/* Certificaciones y carnets */}
        {isWorker && (profile as any)?.licenseTypes && (profile as any).licenseTypes.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-2">Carnets y certificaciones</h3>
            <div className="flex flex-wrap gap-2">
              {(profile as any).licenseTypes.map((license: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {license}
                </span>
              ))}
            </div>
          </div>
        )}

        {isWorker && (profile as any)?.machineryExperience && (profile as any).machineryExperience.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-2">Experiencia en maquinaria</h3>
            <div className="flex flex-wrap gap-2">
              {(profile as any).machineryExperience.map((machine: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                  {machine}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [modalUser, setModalUser] = useState<Application['user'] | null>(null);
  const [requestingContact, setRequestingContact] = useState<Record<string, boolean>>({});

  // Cargar posts de la empresa
  useEffect(() => {
    if (user) {
      fetch(`/api/posts?userId=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
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

  // Solicitar permiso de contacto
  const handleRequestContact = async (applicationId: string) => {
    if (!user) return;

    if (!confirm("¿Enviar solicitud al candidato para compartir sus datos de contacto?")) {
      return;
    }

    setRequestingContact(prev => ({ ...prev, [applicationId]: true }));
    try {
      const res = await fetch(`/api/applications/${applicationId}/contact-permission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user.uid
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Actualizar estado local
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, contactPermission: data.requested } : app
          )
        );
        alert("Solicitud enviada al candidato. Te notificaremos cuando acepte.");
      } else {
        const data = await res.json();
        alert(data.error || "Error al enviar solicitud");
      }
    } catch (error) {
      console.error("Error requesting contact:", error);
      alert("Error al enviar solicitud");
    } finally {
      setRequestingContact(prev => ({ ...prev, [applicationId]: false }));
    }
  };

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

  const hasContactPermission = (app: Application) => {
    return app.status === "ACCEPTED" || app.status === "CONTACTED" || app.contactPermission === true;
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

        {/* Información sobre permisos de contacto */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <strong>Protección de datos:</strong> Los datos de contacto solo se muestran cuando el candidato ha sido aceptado o ha dado su permiso explícito.
            </div>
          </div>
        </div>

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
              const canShowContact = hasContactPermission(app);

              return (
                <div key={app.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex flex-col gap-4">
                    {/* Header con avatar y nombre */}
                    <div className="flex items-center gap-4">
                      {profile?.profileImage ? (
                        <img
                          src={profile.profileImage}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200 cursor-pointer hover:opacity-80"
                          onClick={() => setModalUser(app.user)}
                        />
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm cursor-pointer hover:opacity-80 ${
                            isForeman ? 'bg-gradient-to-br from-orange-400 to-orange-500' : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
                          }`}
                          onClick={() => setModalUser(app.user)}
                        >
                          {profile?.fullName?.[0] || "?"}
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="font-semibold text-slate-800 text-lg cursor-pointer hover:text-emerald-600"
                            onClick={() => setModalUser(app.user)}
                          >
                            {profile?.fullName || "Usuario"}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isForeman ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isForeman ? 'Jefe de cuadrilla' : 'Trabajador'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Inscrito el {new Date(app.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {/* Datos de contacto - con o sin permiso */}
                    <div className={`p-3 rounded-xl border ${canShowContact ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {canShowContact ? (
                            <div>
                              <span className="text-sm font-medium text-green-800">Datos disponibles</span>
                              <p className="text-sm text-green-700">{profile?.phone || user.email}</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-sm font-medium text-slate-600">Datos protegidos</span>
                              <p className="text-xs text-slate-500">Solicita permiso al candidato</p>
                            </div>
                          )}
                        </div>
                        {!canShowContact && (
                          <button
                            onClick={() => handleRequestContact(app.id)}
                            disabled={requestingContact[app.id]}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
                          >
                            {requestingContact[app.id] ? "Enviando..." : "Solicitar datos"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preview de información */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {profile?.province && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {profile.city ? `${profile.city}, ` : ""}{profile.province}
                        </div>
                      )}
                      {profile?.yearsExperience && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {profile.yearsExperience} años
                        </div>
                      )}
                      {isWorker && (profile as any)?.hasVehicle !== undefined && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                          </svg>
                          {(profile as any).hasVehicle ? "Con vehículo" : "Sin vehículo"}
                        </div>
                      )}
                      {isForeman && (profile as any)?.crewSize && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {(profile as any).crewSize} personas
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex flex-wrap gap-2">
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

                      {/* Botón ver perfil completo */}
                      <button
                        onClick={() => setModalUser(app.user)}
                        className="text-sm px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Ver perfil completo
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de perfil */}
      {modalUser && (
        <UserProfileModal
          user={modalUser}
          onClose={() => setModalUser(null)}
        />
      )}
    </main>
  );
}
