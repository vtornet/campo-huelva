"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";

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

interface UserProfileModalProps {
  user: Application['user'];
  onClose: () => void;
}

// Tipos para los filtros
interface CandidateFilters {
  minYearsExperience: number | null;  // Experiencia mínima
  hasVehicle: boolean | null;          // Tiene vehículo (null = todos)
  hasFoodHandlerLicense: boolean | null;  // Carnet manipulador
  hasPhytosanitary: boolean | null;    // Fitosanitario
  canRelocate: boolean | null;         // Puede relocarse
  province: string;                    // Provincia
  sortBy: 'experience' | 'date' | 'name';  // Ordenamiento
}

const FILTERS_STORAGE_KEY = 'agro-candidates-filters';

// Componente modal para ver perfil completo
function UserProfileModal({ user, onClose }: UserProfileModalProps) {
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

        {/* Información de contacto */}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
  const { showNotification } = useNotifications();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [modalUser, setModalUser] = useState<Application['user'] | null>(null);

  // Estados para filtros (NO modifican la lógica existente)
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CandidateFilters>({
    minYearsExperience: null,
    hasVehicle: null,
    hasFoodHandlerLicense: null,
    hasPhytosanitary: null,
    canRelocate: null,
    province: '',
    sortBy: 'date',
  });

  // Cargar filtros guardados al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        setFilters(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading filters:", e);
    }
  }, []);

  // Guardar filtros al cambiar
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      console.error("Error saving filters:", e);
    }
  }, [filters]);

  // Aplicar filtros usando useMemo (no modifica el estado original)
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Filtrar por experiencia mínima
    if (filters.minYearsExperience !== null) {
      result = result.filter(app => {
        const profile = app.user.workerProfile || app.user.foremanProfile;
        return profile && (profile.yearsExperience || 0) >= filters.minYearsExperience!;
      });
    }

    // Filtrar por vehículo
    if (filters.hasVehicle !== null) {
      result = result.filter(app => {
        const profile = app.user.workerProfile;
        return profile && profile.hasVehicle === filters.hasVehicle;
      });
    }

    // Filtrar por carnét manipulador
    if (filters.hasFoodHandlerLicense !== null) {
      result = result.filter(app => {
        const profile = app.user.workerProfile;
        // Verificar si tiene el carnet en licenseTypes
        return profile && profile.licenseTypes?.some(
          l => l.toLowerCase().includes('manipulador') || l.toLowerCase().includes('alimentos')
        ) === filters.hasFoodHandlerLicense;
      });
    }

    // Filtrar por fitosanitario
    if (filters.hasPhytosanitary !== null) {
      result = result.filter(app => {
        const profile = app.user.workerProfile;
        return profile && profile.licenseTypes?.some(
          l => l.toLowerCase().includes('fitosanitario') || l.toLowerCase().includes('fito')
        ) === filters.hasPhytosanitary;
      });
    }

    // Filtrar por reubicación
    if (filters.canRelocate !== null) {
      result = result.filter(app => {
        const profile = app.user.workerProfile;
        return profile && profile.canRelocate === filters.canRelocate;
      });
    }

    // Filtrar por provincia
    if (filters.province) {
      result = result.filter(app => {
        const profile = app.user.workerProfile || app.user.foremanProfile;
        return profile && profile.province === filters.province;
      });
    }

    // Ordenar según criterio seleccionado
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'experience':
          const expA = (a.user.workerProfile || a.user.foremanProfile)?.yearsExperience || 0;
          const expB = (b.user.workerProfile || b.user.foremanProfile)?.yearsExperience || 0;
          return expB - expA; // Mayor a menor
        case 'name':
          const nameA = (a.user.workerProfile || a.user.foremanProfile)?.fullName || '';
          const nameB = (b.user.workerProfile || b.user.foremanProfile)?.fullName || '';
          return nameA.localeCompare(nameB);
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [applications, filters]);

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minYearsExperience !== null) count++;
    if (filters.hasVehicle !== null) count++;
    if (filters.hasFoodHandlerLicense !== null) count++;
    if (filters.hasPhytosanitary !== null) count++;
    if (filters.canRelocate !== null) count++;
    if (filters.province) count++;
    return count;
  }, [filters]);

  // Resetear filtros
  const resetFilters = () => {
    setFilters({
      minYearsExperience: null,
      hasVehicle: null,
      hasFoodHandlerLicense: null,
      hasPhytosanitary: null,
      canRelocate: null,
      province: '',
      sortBy: 'date',
    });
  };

  // Obtener lista de provincias únicas de los candidatos actuales
  const availableProvinces = useMemo(() => {
    const provinces = new Set<string>();
    applications.forEach(app => {
      const profile = app.user.workerProfile || app.user.foremanProfile;
      if (profile?.province) {
        provinces.add(profile.province);
      }
    });
    return Array.from(provinces).sort();
  }, [applications]);

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
        // Mensaje personalizado según el estado
        const statusMessages: Record<string, { type: "success" | "info" | "warning" | "error"; title: string; message: string }> = {
          ACCEPTED: { type: "success", title: "Candidato aceptado", message: "Se notificará al trabajador." },
          REJECTED: { type: "info", title: "Candidato descartado", message: "Se notificará al trabajador." },
          CONTACTED: { type: "success", title: "Marcado como contactado", message: "Estado actualizado correctamente." },
        };
        const msg = statusMessages[newStatus];
        if (msg) {
          showNotification(msg);
        }
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "No se pudo actualizar",
          message: data.error || "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
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

        {/* Panel de Filtros */}
        {applications.length > 0 && (
          <div className="mb-6">
            {/* Botón para mostrar/ocultar filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all mb-3"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="font-semibold text-slate-800">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <span className="text-sm text-slate-500">
                    {filteredApplications.length} de {applications.length} candidatos
                  </span>
                )}
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Panel desplegable de filtros */}
            {showFilters && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
                {/* Fila 1: Experiencia y Ordenar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Experiencia mínima */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Experiencia mínima: {filters.minYearsExperience !== null ? `${filters.minYearsExperience}+ años` : 'Todas'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={filters.minYearsExperience ?? 0}
                      onChange={(e) => setFilters(f => ({ ...f, minYearsExperience: parseInt(e.target.value) || null }))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20+</span>
                    </div>
                  </div>

                  {/* Ordenar por */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ordenar por
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    >
                      <option value="date">Fecha de inscripción</option>
                      <option value="experience">Experiencia (más primero)</option>
                      <option value="name">Nombre (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Fila 2: Filtros booleanos */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Características
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, hasVehicle: f.hasVehicle === null ? true : f.hasVehicle === true ? null : true }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.hasVehicle === true
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : filters.hasVehicle === false
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🚗 Tiene vehículo
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, canRelocate: f.canRelocate === null ? true : f.canRelocate === true ? null : true }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.canRelocate === true
                          ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                          : filters.canRelocate === false
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ✈️ Puede relocarse
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, hasFoodHandlerLicense: f.hasFoodHandlerLicense === null ? true : f.hasFoodHandlerLicense === true ? null : true }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.hasFoodHandlerLicense === true
                          ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                          : filters.hasFoodHandlerLicense === false
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🍎 Manipulador alimentos
                    </button>
                    <button
                      onClick={() => setFilters(f => ({ ...f, hasPhytosanitary: f.hasPhytosanitary === null ? true : f.hasPhytosanitary === true ? null : true }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        filters.hasPhytosanitary === true
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : filters.hasPhytosanitary === false
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🌿 Fitosanitario
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Clic para activar • Volver a clic para desactivar
                  </p>
                </div>

                {/* Fila 3: Provincia */}
                {availableProvinces.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Provincia
                    </label>
                    <select
                      value={filters.province}
                      onChange={(e) => setFilters(f => ({ ...f, province: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                    >
                      <option value="">Todas las provincias</option>
                      {availableProvinces.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="flex-1 px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm"
                  >
                    Aplicar ({filteredApplications.length} resultados)
                  </button>
                </div>
              </div>
            )}
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
        ) : filteredApplications.length === 0 && activeFiltersCount > 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin resultados</h3>
            <p className="text-slate-500 text-sm mb-4">
              Ningún candidato coincide con los filtros aplicados.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => {
              const profile = app.user.workerProfile || app.user.foremanProfile;
              const isWorker = !!app.user.workerProfile;
              const isForeman = !!app.user.foremanProfile;

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

                    {/* Datos de contacto - siempre visibles para la empresa */}
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3,14.284 3,6V5z" />
                        </svg>
                        <div>
                          <span className="text-sm font-medium text-green-800">Datos de contacto</span>
                          <p className="text-sm text-green-700">{profile?.phone || app.user.email}</p>
                        </div>
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
