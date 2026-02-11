"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

import { PROVINCIAS, TIPOS_TAREA } from "@/lib/constants";

export default function Dashboard() {
  const { user, loading, error: authError } = useAuth();
  const router = useRouter();

  // Estado global del usuario (Rol + Perfil)
  const [userData, setUserData] = useState<any>(null);

  // ESTADOS DEL FEED (NUEVOS)
  const [viewMode, setViewMode] = useState<"OFFERS" | "DEMANDS">("OFFERS"); // ¿Qué estamos viendo?
  const [posts, setPosts] = useState<any[]>([]); // Usamos 'posts' en vez de 'offers' porque pueden ser demandas
  const [filterProvince, setFilterProvince] = useState("todas");
  const [filterTaskType, setFilterTaskType] = useState(""); // Filtro por tipo de tarea (solo para demandas)
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

   // 1. CARGA DE DATOS Y PROTECCIÓN
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Usuario no autenticado en Firebase → ir a login
        router.push("/login");
      } else {
        // Usuario autenticado → verificar si existe en BD
        fetch(`/api/user/me?uid=${user.uid}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error && data.exists !== false) {
              setUserData(data);

              // 👮 LEY MARCIAL:
              // Validamos existencia Y contenido. Si no tiene nombre (fullName o companyName),
              // se considera perfil incompleto y se obliga a rellenar.
              const isProfileComplete = data.profile && (data.profile.fullName || data.profile.companyName);

              // Verificar si el usuario está baneado
              if (data.isBanned) {
                return (
                  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
                      <div className="text-6xl mb-4">🔒</div>
                      <h2 className="text-2xl font-bold text-red-800 mb-2 tracking-tight">Cuenta Suspendida</h2>
                      <p className="text-red-600 mb-4">
                        {data.banReason || "Tu cuenta ha sido suspendida por violar las normas de la comunidad."}
                      </p>
                      <p className="text-sm text-gray-500">Contacta con soporte para más información.</p>
                    </div>
                  </div>
                );
              }

              if (!isProfileComplete) {
                console.log("Perfil incompleto detectado. Redirigiendo según rol...");

                // Redirigir según el rol a la página de perfil correcta
                if (data.role === 'COMPANY') {
                  router.push("/profile/company");
                } else if (data.role === 'FOREMAN') {
                  router.push("/profile/foreman");
                } else {
                  router.push("/profile/worker");
                }
                return;
              }
              // Si el perfil está completo, mostramos el dashboard (no hacemos nada más)
            } else {
              // Usuario no existe en BD → ir a onboarding
              router.push("/onboarding");
            }
          })
          .catch((err) => {
            console.error("Error verificando usuario:", err);
            // En caso de error de conexión, permitimos acceso pero mostramos estado
            // No redirigimos automáticamente para evitar bucles infinitos
          });
      }
    }
  }, [user, loading, router]);

  // 2. FUNCIÓN PARA CARGAR PUBLICACIONES (OFERTAS O DEMANDAS)
  const fetchPosts = async (reset = false) => {
    if (loadingPosts) return;
    setLoadingPosts(true);

    try {
      const currentPage = reset ? 1 : page;
      // Enviamos viewMode para que la API sepa si devolver ofertas o demandas
      // Si hay filtro de tarea, lo añadimos a la URL
      const taskParam = filterTaskType ? `&taskType=${filterTaskType}` : "";
      const res = await fetch(`/api/posts?page=${currentPage}&province=${filterProvince}&view=${viewMode}${taskParam}`);

      if (!res.ok) {
        console.error("Error en API:", res.status);
        if (reset) setPosts([]);
        return;
      }

      const newPosts = await res.json();

      // Asegurar que newPosts es un array
      if (!Array.isArray(newPosts)) {
        console.error("La API no devolvió un array:", newPosts);
        if (reset) setPosts([]);
        return;
      }

      if (reset) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);

      if (newPosts.length < 5) setHasMore(false);
      else setHasMore(true);

      if (!reset) setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error cargando posts", error);
      if (reset) setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Recargar cuando cambie el filtro o la pestaña (Ofertas/Demandas)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(true);
  }, [filterProvince, viewMode, filterTaskType]);

  // Cargar contador de mensajes no leídos
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const res = await fetch(`/api/messages/unread?userId=${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("Error loading unread count:", error);
        }
      };
      loadUnreadCount();
      // Recargar cada 15 segundos
      const interval = setInterval(loadUnreadCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Cargar contador de notificaciones
  useEffect(() => {
    if (user) {
      const loadNotificationCount = async () => {
        try {
          const res = await fetch(`/api/notifications/count?userId=${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setNotificationCount(data.count || 0);
          }
        } catch (error) {
          console.error("Error loading notification count:", error);
        }
      };
      loadNotificationCount();
      // Recargar cada 20 segundos
      const interval = setInterval(loadNotificationCount, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);


  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (!user) return null;

  // Mostrar error de autenticación si lo hay
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md shadow-sm">
          <h2 className="text-xl font-bold text-red-800 mb-2 tracking-tight">Error de Autenticación</h2>
          <p className="text-red-600 mb-4">{authError}</p>
          <button
            onClick={() => window.location.href = "/login"}
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-200 font-medium"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  const profile = userData?.profile;
  const role = userData?.role;

  // Función para ir a publicar el tipo correcto
  const handlePublish = (type: "OFFER" | "DEMAND") => {
    router.push(`/publish?type=${type}`);
  };

  // Función para contactar con el autor de una publicación
  const handleContact = async (post: any) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Obtener ID del otro usuario
    const otherUserId = post.company?.user?.id || post.publisher?.id;
    if (!otherUserId) {
      alert("No se puede contactar con este autor");
      return;
    }

    if (otherUserId === user.uid) {
      alert("No puedes contactarte contigo mismo");
      return;
    }

    // Crear conversación y redirigir
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: otherUserId,
          content: `Hola, me interesa tu publicación: ${post.title}`,
          postId: post.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      } else {
        alert("Error al iniciar conversación");
      }
    } catch (error) {
      console.error("Error contacting:", error);
      alert("Error al iniciar conversación");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white text-slate-800 px-4 py-3 shadow-sm border-b border-slate-200/60 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
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
            {(userData?.role === 'ADMIN' || user?.email === "vtornet@gmail.com") && (
              <button onClick={() => router.push("/admin")} className="text-xs bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-xl transition-all duration-200 font-medium shadow-sm shadow-red-500/20">
                Admin
              </button>
            )}
            {/* Debug info - eliminar en producción */}
            <button onClick={() => console.log("User data:", { user, userData })} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-3 rounded-xl transition-all duration-200 font-medium hidden sm:block">
              Debug
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/notifications")} className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm shadow-red-500/30">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>
            <button onClick={() => router.push("/messages")} className="relative bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm shadow-red-500/30">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => router.push("/profile")} className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="max-w-[120px] truncate">{profile?.fullName || profile?.companyName || user.email}</span>
            </button>
            <button onClick={() => auth.signOut()} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-xl transition-all duration-200 font-medium">
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* === BOTONES DE ACCIÓN (PUBLICAR) === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6 flex flex-wrap gap-4 items-center shadow-black/5">
           <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Publicar</h3>

           {role === 'COMPANY' ? (
             <>
               <button onClick={() => handlePublish("OFFER")} className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-3 px-5 rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-sm shadow-emerald-500/25 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Publicar oferta oficial
               </button>
               {/* Botón de búsqueda de candidatos - para empresas */}
               <button onClick={() => router.push("/profile/company/search")} className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm shadow-blue-500/25 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Buscar candidatos
               </button>
             </>
           ) : (
             <>
               {/* Trabajadores y Manijeros ven esto */}
               <button onClick={() => handlePublish("DEMAND")} className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3 px-5 rounded-xl font-semibold hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-sm shadow-orange-500/25 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Publicar demanda
                  <span className="text-[10px] bg-orange-800/30 px-2 py-0.5 rounded-full text-white/90">Busco tajo</span>
               </button>
               <button onClick={() => handlePublish("OFFER")} className="bg-slate-50 border-2 border-dashed border-slate-200 text-slate-600 py-3 px-5 rounded-xl font-medium hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all duration-200 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir oferta
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-500">Vi un anuncio</span>
               </button>
             </>
           )}
        </div>

        {/* === FEED CON PESTAÑAS === */}
        <div>

          {/* PESTAÑAS SUPERIORES (OFERTAS VS DEMANDAS) */}
          <div className="flex gap-6 mb-6 border-b border-slate-200/60">
            <button
              onClick={() => setViewMode("OFFERS")}
              className={`pb-4 px-1 font-semibold text-base transition-all duration-200 relative ${viewMode === "OFFERS" ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Ofertas de empleo
              {viewMode === "OFFERS" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"></span>}
            </button>
            <button
              onClick={() => setViewMode("DEMANDS")}
              className={`pb-4 px-1 font-semibold text-base transition-all duration-200 relative ${viewMode === "DEMANDS" ? "text-orange-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Candidatos y demandas
              {viewMode === "DEMANDS" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></span>}
            </button>
          </div>

          {/* FILTRO PROVINCIAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-5 overflow-x-auto flex gap-2 no-scrollbar shadow-black/5">
            <button onClick={() => setFilterProvince("todas")} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${filterProvince === "todas" ? "bg-slate-800 text-white shadow-md shadow-slate-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Todas</button>
            {PROVINCIAS.map(p => (
              <button key={p} onClick={() => setFilterProvince(p)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${filterProvince === p ? "bg-slate-800 text-white shadow-md shadow-slate-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{p}</button>
            ))}
          </div>

          {/* FILTRO POR TIPO DE TAREA - Solo para demandas */}
          {viewMode === "DEMANDS" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 mb-5 overflow-x-auto">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterTaskType("")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    filterTaskType === ""
                      ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todas
                </button>
                {TIPOS_TAREA.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setFilterTaskType(tipo)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      filterTaskType === tipo
                        ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LISTADO DE POSTS (CON ESTILOS SEGÚN TIPO) */}
          <div className="space-y-4">
            {posts.length === 0 && !loadingPosts ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No hay publicaciones</h3>
                <p className="text-slate-500 text-sm">Sé el primero en publicar en {filterProvince === "todas" ? "tu zona" : filterProvince}.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-200 group relative overflow-hidden hover:scale-[1.01] hover:shadow-md shadow-black/5 ${
                    post.type === "OFFICIAL" ? "border-emerald-200/80 hover:border-emerald-300" :
                    post.type === "DEMAND" ? "border-orange-200/80 hover:border-orange-300" :
                    "border-slate-200/60 hover:border-slate-300" // SHARED
                }`}>

                  {/* ETIQUETA DE TIPO */}
                  <div className="absolute top-4 right-4">
                     {post.type === "OFFICIAL" && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-3 py-1 rounded-full border border-emerald-200 shadow-sm">Empresa verificada</span>}
                     {post.type === "SHARED" && <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-3 py-1 rounded-full border border-slate-200">Compartida</span>}
                     {post.type === "DEMAND" && <span className="bg-orange-100 text-orange-800 text-[10px] font-semibold px-3 py-1 rounded-full border border-orange-200">Demanda</span>}
                  </div>

                  <div className="pr-20">
                      <h3 className={`font-bold text-lg tracking-tight ${post.type === 'DEMAND' ? 'text-orange-900' : 'text-slate-800'} group-hover:text-emerald-600 transition-colors`}>
                        {post.title}
                      </h3>
                      {/* Mostrar tipo de tarea solo para demandas */}
                      {post.type === 'DEMAND' && post.taskType && (
                        <span className="inline-block ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          {post.taskType}
                        </span>
                      )}
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {post.location}{post.province && `, ${post.province}`}
                      </p>
                  </div>

                  <p className="mt-4 text-slate-600 text-sm line-clamp-3 bg-slate-50 p-4 rounded-xl italic border border-slate-100">
                    "{post.description}"
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Avatar con inicial */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${
                            post.type === 'DEMAND' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                            post.type === 'OFFICIAL' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                            'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>
                            {post.company?.companyName?.[0] || post.publisher?.workerProfile?.fullName?.[0] || post.publisher?.foremanProfile?.fullName?.[0] || "?"}
                        </div>
                        <span className="text-sm text-slate-700 font-medium">
                            {post.company?.companyName || post.publisher?.workerProfile?.fullName || post.publisher?.foremanProfile?.fullName || "Usuario"}
                        </span>
                    </div>
                    <button
                      onClick={() => handleContact(post)}
                      className="text-sm font-semibold text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1"
                    >
                      Contactar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}

            {hasMore && posts.length > 0 && (
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingPosts}
                className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm shadow-black/5"
              >
                {loadingPosts ? "Cargando..." : "Cargar más"}
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
