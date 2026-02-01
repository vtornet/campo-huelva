"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";

import { PROVINCIAS } from "@/lib/constants";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Estado global del usuario (Rol + Perfil)
  const [userData, setUserData] = useState<any>(null);

  // ESTADOS DEL FEED (NUEVOS)
  const [viewMode, setViewMode] = useState<"OFFERS" | "DEMANDS">("OFFERS"); // ¿Qué estamos viendo?
  const [posts, setPosts] = useState<any[]>([]); // Usamos 'posts' en vez de 'offers' porque pueden ser demandas
  const [filterProvince, setFilterProvince] = useState("todas");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

   // 1. CARGA DE DATOS Y PROTECCIÓN
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        fetch(`/api/user/me?uid=${user.uid}`)
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error) {
              setUserData(data);

              // 👮 LEY MARCIAL:
              // Validamos existencia Y contenido. Si no tiene nombre (fullName o companyName),
              // se considera perfil incompleto y se obliga a rellenar.
              const isProfileComplete = data.profile && (data.profile.fullName || data.profile.companyName);

              // Código mejorado:
            if (!isProfileComplete) {
              console.log("Perfil incompleto detectado. Redirigiendo a onboarding...");
              // Pequeña pausa de seguridad o verificación extra si quisieras
              router.push("/onboarding");
              return;
            }
            } else {
              // Si ni siquiera devuelve datos (error 404), también fuera
              router.push("/onboarding");
            }
          })
          .catch(() => router.push("/login"));
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
      const res = await fetch(`/api/posts?page=${currentPage}&province=${filterProvince}&view=${viewMode}`);
      const newPosts = await res.json();

      if (reset) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);

      if (newPosts.length < 5) setHasMore(false);
      else setHasMore(true);

      if (!reset) setPage((prev) => prev + 1);
    } catch (error) {
      console.error("Error cargando posts", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Recargar cuando cambie el filtro o la pestaña (Ofertas/Demandas)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(true);
  }, [filterProvince, viewMode]);


  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div></div>;
  if (!user) return null;

  const profile = userData?.profile;
  const role = userData?.role;

  // Función para ir a publicar el tipo correcto
  const handlePublish = (type: "OFFER" | "DEMAND") => {
    router.push(`/publish?type=${type}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-green-700 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="font-bold text-lg tracking-tight">Red Agrícola</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block opacity-90">{user.email}</span>
            <button onClick={() => auth.signOut()} className="text-xs bg-green-800 hover:bg-green-900 py-1.5 px-3 rounded border border-green-600">Salir</button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* === COLUMNA IZQUIERDA (PERFIL Y ACCIONES) === */}
        <div className="md:col-span-1 space-y-6">
          
          {/* 1. FICHA INTELIGENTE (RECUPERADA COMPLETA) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`p-4 border-b ${role === 'FOREMAN' ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
              <h2 className={`font-bold ${role === 'FOREMAN' ? 'text-orange-800' : 'text-green-800'}`}>
                {role === 'FOREMAN' ? '📋 Manijero' : (role === 'COMPANY' ? '🏢 Empresa' : '👤 Trabajador')}
              </h2>
            </div>
            
            <div className="p-4">
              {profile ? (
                <>
                  <div className="mb-4">
                    <p className="text-xl font-bold text-gray-800">{profile.fullName || profile.companyName || "Usuario"}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">📍 {profile.city ? `${profile.city}, ` : ""}{profile.province || "España"}</p>
                  </div>

                  {/* --- DATOS DE TRABAJADOR --- */}
                  {role === 'USER' && (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4 text-xs">
                        {profile.hasVehicle && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">🚗 Coche</span>}
                        {profile.foodHandler && <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-100">🍎 Manipulador</span>}
                        {profile.phytosanitaryLevel && <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-100">🧪 Fito</span>}
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Experiencia:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.experience?.map((tag:string) => <span key={tag} className="bg-gray-100 text-xs px-2 py-1 rounded">{tag}</span>)}
                      </div>
                      <button onClick={() => router.push("/profile/worker")} className="w-full mt-6 text-sm text-green-600 font-medium hover:underline text-left">✏️ Editar Trabajador</button>
                    </>
                  )}

                  {/* --- DATOS DE MANIJERO --- */}
                  {role === 'FOREMAN' && (
                    <>
                      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                        <div className="bg-orange-50 p-2 rounded border border-orange-100">
                           <span className="block text-xl font-bold text-orange-800">{profile.crewSize || 0}</span>
                           <span className="text-xs text-orange-600">Personas</span>
                        </div>
                        <div className="bg-orange-50 p-2 rounded border border-orange-100">
                           <span className="block text-xl font-bold text-orange-800">{profile.yearsExperience || 0}</span>
                           <span className="text-xs text-orange-600">Campañas</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4 text-xs">
                        {profile.hasVan && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">🚐 Furgonetas</span>}
                        {profile.ownTools && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200">✂️ Herramientas</span>}
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Especialidades:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.specialties?.map((tag:string) => <span key={tag} className="bg-orange-50 text-orange-800 text-xs px-2 py-1 rounded border border-orange-100">{tag}</span>)}
                      </div>
                      <button onClick={() => router.push("/profile/foreman")} className="w-full mt-6 text-sm text-orange-600 font-medium hover:underline text-left">✏️ Editar Cuadrilla</button>
                    </>
                  )}

                   {/* --- DATOS DE EMPRESA --- */}
                   {role === 'COMPANY' && (
                    <>
                        <p className="text-sm text-gray-500 mb-2">CIF: {profile.cif}</p>
                        <button className="text-sm text-green-600 hover:underline">⚙️ Configuración</button>
                    </>
                   )}

                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Perfil sin datos</p>
                  <button 
                    onClick={() => router.push(role === 'FOREMAN' ? "/profile/foreman" : "/profile/worker")} 
                    className="text-green-600 font-bold text-sm"
                  >
                    Rellenar ficha ahora
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 2. ACCIONES (BOTONES SEGÚN ROL - NUEVO) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
             <h3 className="font-bold text-gray-800 text-sm uppercase">Publicar</h3>
             
             {role === 'COMPANY' ? (
               <button onClick={() => handlePublish("OFFER")} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-sm">
                  📝 Publicar Oferta Oficial
               </button>
             ) : (
               <>
                 {/* Trabajadores y Manijeros ven esto */}
                 <button onClick={() => handlePublish("DEMAND")} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 shadow-sm flex items-center justify-center gap-2">
                    🗣️ Publicar Demanda
                    <span className="text-[10px] bg-orange-800 px-1 rounded opacity-70 text-white">Busco tajo</span>
                 </button>
                 <button onClick={() => handlePublish("OFFER")} className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition flex items-center justify-center gap-2">
                    📢 Compartir Oferta
                    <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Vi un anuncio</span>
                 </button>
               </>
             )}
          </div>
        </div>

        {/* === COLUMNA DERECHA: EL FEED CON PESTAÑAS === */}
        <div className="md:col-span-2">
          
          {/* PESTAÑAS SUPERIORES (OFERTAS VS DEMANDAS) */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button 
              onClick={() => setViewMode("OFFERS")}
              className={`pb-3 px-2 font-bold text-lg transition ${viewMode === "OFFERS" ? "text-green-700 border-b-4 border-green-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Ofertas de Empleo
            </button>
            <button 
              onClick={() => setViewMode("DEMANDS")}
              className={`pb-3 px-2 font-bold text-lg transition ${viewMode === "DEMANDS" ? "text-orange-700 border-b-4 border-orange-600" : "text-gray-400 hover:text-gray-600"}`}
            >
              Candidatos / Demandas
            </button>
          </div>

          {/* FILTRO PROVINCIAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-4 overflow-x-auto flex gap-2 no-scrollbar">
            <button onClick={() => setFilterProvince("todas")} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filterProvince === "todas" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>🌍 Todas</button>
            {PROVINCIAS.map(p => (
              <button key={p} onClick={() => setFilterProvince(p)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${filterProvince === p ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{p}</button>
            ))}
          </div>

          {/* LISTADO DE POSTS (CON ESTILOS SEGÚN TIPO) */}
          <div className="space-y-4">
            {posts.length === 0 && !loadingPosts ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                <div className="text-4xl mb-2">📭</div>
                <h3 className="text-lg font-semibold text-gray-800">No hay nada por aquí</h3>
                <p className="text-gray-500 text-sm">Sé el primero en publicar en {filterProvince}.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className={`bg-white p-5 rounded-xl shadow-sm border transition group relative overflow-hidden ${
                    post.type === "OFFICIAL" ? "border-green-200 hover:border-green-300" : 
                    post.type === "DEMAND" ? "border-orange-200 hover:border-orange-300" : 
                    "border-gray-200 border-dashed hover:border-gray-300" // SHARED
                }`}>
                  
                  {/* ETIQUETA DE TIPO */}
                  <div className="absolute top-0 right-0 p-3">
                     {post.type === "OFFICIAL" && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200">✅ EMPRESA VERIFICADA</span>}
                     {post.type === "SHARED" && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">🔗 COMPARTIDA</span>}
                     {post.type === "DEMAND" && <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200">🙋‍♂️ DEMANDA</span>}
                  </div>

                  <div className="pr-24"> 
                      <h3 className={`font-bold text-lg ${post.type === 'DEMAND' ? 'text-orange-900' : 'text-gray-800'} group-hover:text-green-700 transition`}>
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        📍 {post.location} ({post.province || "España"})
                      </p>
                  </div>
                  
                  <p className="mt-3 text-gray-600 text-sm line-clamp-3 bg-gray-50 p-3 rounded-lg italic border border-gray-100">
                    "{post.description}"
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {/* Avatar con inicial */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${post.type === 'DEMAND' ? 'bg-orange-400' : 'bg-green-600'}`}>
                            {post.company?.companyName?.[0] || post.publisher?.workerProfile?.fullName?.[0] || post.publisher?.foremanProfile?.fullName?.[0] || "?"}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            {post.company?.companyName || post.publisher?.workerProfile?.fullName || post.publisher?.foremanProfile?.fullName || "Usuario"}
                        </span>
                    </div>
                    <button className="text-sm font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded transition">
                      {post.type === "DEMAND" ? "Contactar" : "Ver Oferta"} →
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {hasMore && posts.length > 0 && (
              <button 
                onClick={() => fetchPosts(false)} 
                disabled={loadingPosts}
                className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                {loadingPosts ? "Cargando..." : "👇 Cargar más ofertas"}
              </button>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}