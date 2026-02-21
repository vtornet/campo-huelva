"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const dynamic = 'force-dynamic';

interface Post {
  id: string;
  title: string;
  description: string;
  location: string;
  province?: string;
  type: string;
  status: string;
  taskType?: string;
  contractType?: string;
  salaryAmount?: string;
  createdAt: string;
  likesCount: number;
  sharesCount: number;
  _count?: {
    applications?: number;
  };
}

export default function MyPostsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [archiving, setArchiving] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
      // Obtener el rol del usuario desde la API
      fetch(`/api/user/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.role) {
            setUserRole(data.role);
          }
        })
        .catch(err => console.error("Error fetching user role:", err));
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/posts?userId=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        const postsArray = Array.isArray(data) ? data : [];
        console.log("Posts loaded:", postsArray.map(p => ({ id: p.id, title: p.title, status: p.status })));
        setPosts(postsArray);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.")) {
      return;
    }
    if (!user) return;

    setDeleting(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}?userId=${user.uid}&action=delete`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        alert("Publicación eliminada correctamente");
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar la publicación");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error al eliminar la publicación");
    } finally {
      setDeleting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleArchive = async (postId: string) => {
    if (!user) return;

    setArchiving(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}?userId=${user.uid}&action=archive`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, status: 'HIDDEN' } : p
        ));
        alert("Publicación archivada correctamente");
      } else {
        const data = await res.json();
        alert(data.error || "Error al archivar la publicación");
      }
    } catch (error) {
      console.error("Error archiving post:", error);
      alert("Error al archivar la publicación");
    } finally {
      setArchiving(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleUnarchive = async (postId: string) => {
    if (!user) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, status: "ACTIVE" })
      });

      if (res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, status: 'ACTIVE' } : p
        ));
        alert("Publicación reactivada correctamente");
      } else {
        const data = await res.json();
        alert(data.error || "Error al reactivar la publicación");
      }
    } catch (error) {
      console.error("Error unarchiving post:", error);
      alert("Error al reactivar la publicación");
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

  const filteredPosts = posts.filter(p => {
    if (filter === 'active') return p.status === 'ACTIVE';
    if (filter === 'archived') return p.status === 'HIDDEN';
    return true;
  });

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'OFFICIAL': return 'Oferta de empresa';
      case 'SHARED': return 'Oferta compartida';
      case 'DEMAND': return 'Demanda de empleo';
      default: return type;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'OFFICIAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHARED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DEMAND': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'HIDDEN') {
      return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Archivada</span>;
    }
    return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Activa</span>;
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
            <h1 className="text-xl font-bold text-slate-800">Mis Publicaciones 🔄 V2.0</h1>
          </div>
          <button
            onClick={() => {
              // Si es empresa, va a oferta; si no, va a demanda (trabajadores, etc.)
              const publishType = userRole === 'COMPANY' ? 'OFFER' : 'DEMAND';
              router.push(`/publish?type=${publishType}`);
            }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva publicación
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({posts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Activas ({posts.filter(p => p.status === 'ACTIVE').length})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'archived'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Archivadas ({posts.filter(p => p.status === 'HIDDEN').length})
          </button>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin publicaciones</h3>
            <p className="text-slate-500 text-sm mb-4">
              {filter === 'archived'
                ? "No tienes publicaciones archivadas."
                : "Aún no has creado ninguna publicación."}
            </p>
            <button
              onClick={() => {
                // Si es empresa, va a oferta; si no, va a demanda (trabajadores, etc.)
                const publishType = userRole === 'COMPANY' ? 'OFFER' : 'DEMAND';
                router.push(`/publish?type=${publishType}`);
              }}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              Crear mi primera publicación
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPostTypeColor(post.type)}`}>
                        {getPostTypeLabel(post.type)}
                      </span>
                      {getStatusBadge(post.status)}
                      <span className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{post.title}</h3>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">{post.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {post.location}
                      </span>
                      {post.taskType && (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs">
                          {post.taskType}
                        </span>
                      )}
                    </div>
                    {post.salaryAmount && (
                      <p className="text-sm font-semibold text-emerald-600 mt-2">
                        Salario: {post.salaryAmount}
                      </p>
                    )}
                  </div>

                  {/* Estadísticas y acciones */}
                  <div className="flex md:flex-col items-center gap-4 md:gap-2">
                    <div className="flex gap-4 text-center">
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">{post.likesCount || 0}</div>
                        <div className="text-slate-500">Me gusta</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800">{post._count?.applications || 0}</div>
                        <div className="text-slate-500">Inscritos</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting[post.id]}
                        className="inline-flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                      <button
                        onClick={() => {
                          if (post.status === 'ACTIVE') {
                            handleArchive(post.id);
                          } else {
                            handleUnarchive(post.id);
                          }
                        }}
                        disabled={archiving[post.id]}
                        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg transition text-sm font-medium ${
                          post.status === 'ACTIVE'
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {post.status === 'ACTIVE' ? 'Archivar' : 'Reactivar'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
