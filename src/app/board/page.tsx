// src/app/board/page.tsx
// Página del Tablón Social

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import CreateBoardPost from '@/components/CreateBoardPost';
import BoardPostCard from '@/components/BoardPostCard';
import { Role } from '@prisma/client';

interface BoardPost {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
  createdAt: string;
  authorId: string;
  author: any;
}

export default function BoardPage() {
  const { user, loading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          setUserData(data);
        })
        .catch(err => console.error('Error loading user data:', err));
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async (reset = false) => {
    if (loadingPosts && !reset) return;

    const currentPage = reset ? 1 : page;
    setLoadingPosts(true);

    try {
      const res = await fetch(`/api/board?page=${currentPage}&currentUserId=${user?.uid || ''}`);

      if (!res.ok) {
        console.error('Error fetching posts:', res.status, res.statusText);
        setPosts([]);
        setHasMore(false);
        return;
      }

      const newPosts = await res.json();

      if (Array.isArray(newPosts)) {
        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasMore(newPosts.length >= 10);
        if (!reset) setPage(prev => prev + 1);
      } else {
        console.error('Respuesta no es array:', newPosts);
        setPosts([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error cargando posts:', error);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLoadMore = () => {
    loadPosts();
  };

  const handleUpdatePost = (postId: string, updates: Partial<BoardPost>) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    ));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Tablón</h1>
                <p className="text-xs text-slate-500">Comunidad Red Agro</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Formulario para crear post */}
        {userData?.role !== Role.COMPANY && (
          <CreateBoardPost onPostCreated={() => loadPosts(true)} />
        )}

        {/* Aviso para empresas */}
        {userData?.role === Role.COMPANY && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-amber-800">Las empresas no pueden publicar en el tablón</h3>
                <p className="text-sm text-amber-700 mt-1">
                  El tablón es un espacio para que trabajadores y profesionales del sector se comuniquen.
                  Si quieres publicar una oferta de empleo, utiliza la sección de <a href="/" className="underline font-medium">Ofertas</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de posts */}
        {loadingPosts && posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-500 mt-3">Cargando publicaciones...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Tablón vacío</h3>
            <p className="text-slate-500 text-sm">
              Sé el primero en compartir algo con la comunidad.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <BoardPostCard
                key={post.id}
                post={post}
                onUpdate={handleUpdatePost}
                onDelete={handleDeletePost}
              />
            ))}

            {/* Cargar más */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingPosts}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  {loadingPosts ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
