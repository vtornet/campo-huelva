"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "@/components/ConfirmDialog";

type TabType = "profile" | "posts" | "contacts" | "search";

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Datos del usuario
  const [userData, setUserData] = useState<any>(null);

  // Datos de publicaciones
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

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

  // Cargar publicaciones del usuario cuando se cambia a la pestaña
  useEffect(() => {
    if (activeTab === "posts" && user) {
      loadUserPosts();
    }
  }, [activeTab, user]);

  const loadUserPosts = async () => {
    if (!user) return;
    setPostsLoading(true);
    try {
      const res = await fetch(`/api/posts?userId=${user.uid}`);
      if (res.ok) {
        const posts = await res.json();
        setUserPosts(Array.isArray(posts) ? posts : []);
      }
    } catch (error) {
      console.error("Error cargando publicaciones:", error);
    } finally {
      setPostsLoading(false);
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

  const handleDeletePost = async (postId: string) => {
    const confirmed = await confirm({
      title: "Eliminar publicación",
      message: "¿Eliminar esta publicación? Esta acción no se puede deshacer.",
      type: "danger",
    });
    if (!confirmed) return;

    fetch(`/api/posts/${postId}?userId=${user.uid}&action=delete`, { method: "DELETE" })
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar simplificado */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div
            className="cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => router.push("/")}
          >
            <Image
              src="/logo.png"
              alt="Agro Red"
              width={140}
              height={40}
              priority
            />
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
          <div className="flex border-b border-slate-200/60">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-4 px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "profile" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-4 px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "posts" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Mis Publicaciones
              {userPosts.length > 0 && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {userPosts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`flex-1 py-4 px-4 font-medium text-center transition-all duration-200 relative ${
                activeTab === "contacts" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8c0 1.574-.512 3.042-1.395 3.72L21 12z" />
              </svg>
              Mensajes
            </button>
            {/* Solo para empresas */}
            {role === 'COMPANY' && (
              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-4 px-4 font-medium text-center transition-all duration-200 relative ${
                  activeTab === "search" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar Perfiles
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
                    {userPosts.map((post) => (
                      <div key={post.id} className={`bg-white p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        post.type === "OFFICIAL" ? "border-emerald-200/80" :
                        post.type === "DEMAND" ? "border-orange-200/80" :
                        "border-slate-200/60"
                      }`}>
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                post.type === "OFFICIAL" ? "bg-emerald-100 text-emerald-700" :
                                post.type === "DEMAND" ? "bg-orange-100 text-orange-700" :
                                "bg-slate-100 text-slate-600"
                              }`}>
                                {post.type === "OFFICIAL" ? "Oficial" :
                                 post.type === "DEMAND" ? "Demanda" :
                                 "Compartida"}
                              </span>
                              <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h4 className={`font-bold ${post.type === 'DEMAND' ? 'text-orange-900' : 'text-slate-800'}`}>
                              {post.title}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">{post.location}{post.province && `, ${post.province}`}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/publish?edit=${post.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition text-sm font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Contactos/Mensajes */}
            {activeTab === "contacts" && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8c0 1.574-.512 3.042-1.395 3.72L21 12z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Mensajes</h3>
                <p className="text-slate-500 text-sm mb-4">Gestiona tus conversaciones desde la página de mensajes.</p>
                <button
                  onClick={() => router.push("/messages")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200"
                >
                  Ir a Mensajes
                </button>
              </div>
            )}

            {/* Tab Buscar Perfiles (solo empresas) */}
            {activeTab === "search" && role === 'COMPANY' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Buscar Trabajadores y Manijeros</h3>
                <p className="text-slate-500 text-sm mb-4">Encuentra perfiles cualificados con filtros avanzados por experiencia, ubicación y disponibilidad.</p>
                <button
                  onClick={() => router.push("/profile/company/search")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200"
                >
                  Abrir Buscador
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialogComponent />
    </div>
  );
}
