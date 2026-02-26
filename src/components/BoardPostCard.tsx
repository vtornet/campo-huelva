// src/components/BoardPostCard.tsx
// Componente de tarjeta para publicaciones del Tablón Social

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/Notifications';
import { usePromptDialog } from '@/components/PromptDialog';
import { useConfirmDialog } from '@/components/ConfirmDialog';
import { AddContactButton } from '@/components/AddContactButton';
import BoardCommentSection from '@/components/BoardCommentSection';
import Link from 'next/link';

interface Profile {
  fullName?: string;
  city?: string;
  province?: string;
  profileImage?: string;
}

interface Author {
  id: string;
  role: string;
  workerProfile?: Profile;
  foremanProfile?: Profile;
  engineerProfile?: Profile;
  encargadoProfile?: Profile;
  tractoristProfile?: Profile;
}

interface BoardPost {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  liked?: boolean;
  createdAt: string;
  authorId: string;
  author: Author;
}

interface BoardPostCardProps {
  post: BoardPost;
  onUpdate?: (postId: string, updates: Partial<BoardPost>) => void;
  onDelete?: (postId: string) => void;
}

export default function BoardPostCard({ post, onUpdate, onDelete }: BoardPostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [animatingLike, setAnimatingLike] = useState(false);

  // Obtener nombre del autor según su rol
  const getAuthorName = () => {
    const profile = post.author.workerProfile
      || post.author.foremanProfile
      || post.author.engineerProfile
      || post.author.encargadoProfile
      || post.author.tractoristProfile;

    return profile?.fullName || 'Usuario';
  };

  // Obtener ubicación del autor
  const getAuthorLocation = () => {
    const profile = post.author.workerProfile
      || post.author.foremanProfile
      || post.author.engineerProfile
      || post.author.encargadoProfile
      || post.author.tractoristProfile;

    if (profile?.city && profile?.province) {
      return `${profile.city}, ${profile.province}`;
    }
    return profile?.province || '';
  };

  // Obtener foto del autor
  const getAuthorImage = () => {
    const profile = post.author.workerProfile
      || post.author.foremanProfile
      || post.author.engineerProfile
      || post.author.encargadoProfile
      || post.author.tractoristProfile;

    return profile?.profileImage;
  };

  // Obtener color según rol
  const getRoleColor = () => {
    switch (post.author.role) {
      case 'FOREMAN': return 'from-orange-400 to-orange-500';
      case 'ENGINEER': return 'from-blue-400 to-blue-500';
      case 'ENCARGADO': return 'from-purple-400 to-purple-500';
      case 'TRACTORISTA': return 'from-cyan-400 to-cyan-500';
      default: return 'from-green-400 to-green-500'; // USER/Trabajador
    }
  };

  const isOwner = user?.uid === post.authorId;

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isOwner) return;

    if (!liked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 300);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/board-posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid // Fallback para cuando Firebase Admin no está configurado
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
        onUpdate?.(post.id, { likesCount: data.likesCount });
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    const shareUrl = `${window.location.origin}/board`;
    const shareText = 'Mira esta publicación en Red Agro';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Red Agro - Tablón',
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (shareError: any) {
        if (shareError.name === 'AbortError') return;
      }
    }

    // Copiar al portapapeles
    try {
      await navigator.clipboard.writeText(shareUrl);
      showNotification({
        type: 'success',
        title: '¡Enlace copiado!',
        message: 'Ya puedes compartirlo con quien quieras.',
      });
    } catch (error) {
      showNotification({
        type: 'warning',
        title: 'No se pudo copiar',
        message: `Copia esta URL manualmente: ${shareUrl}`,
        duration: 6000,
      });
    }
  };

  const handleReport = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isOwner) {
      showNotification({
        type: 'warning',
        title: 'No es posible',
        message: 'No puedes denunciar tu propia publicación.',
      });
      return;
    }

    const reason = await prompt({
      title: 'Denunciar publicación',
      message: '¿Por qué denunciás esta publicación?',
      placeholder: 'Razón de la denuncia...',
      type: 'warning',
      required: true,
    });
    if (!reason) return;

    const description = await prompt({
      title: 'Descripción adicional',
      message: 'Añade más detalles (opcional):',
      placeholder: 'Descripción adicional...',
      type: 'info',
    });

    setLoading(true);
    try {
      const res = await fetch('/api/board/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'POST',
          postId: post.id,
          reason,
          description
        })
      });

      if (res.ok) {
        showNotification({
          type: 'success',
          title: 'Denuncia enviada',
          message: 'Gracias por ayudarnos a mantener la comunidad segura.',
        });
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'No se pudo enviar',
          message: data.error || 'Inténtalo de nuevo más tarde.',
        });
      }
    } catch (error) {
      console.error('Error al denunciar:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmed = await confirm({
      title: 'Eliminar publicación',
      message: '¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.',
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/board-posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (res.ok) {
        showNotification({
          type: 'success',
          title: 'Publicación eliminada',
          message: 'Tu publicación ha sido eliminada correctamente.',
        });
        onDelete?.(post.id);
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'No se pudo eliminar',
          message: data.error || 'Inténtalo de nuevo más tarde.',
        });
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isOwner) {
      showNotification({
        type: 'warning',
        title: 'No es posible',
        message: 'No puedes contactarte contigo mismo.',
      });
      return;
    }

    // Buscar o crear conversación con el autor (sin enviar mensaje)
    setLoading(true);
    try {
      const res = await fetch('/api/messages/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: user.uid,
          userId2: post.authorId,
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Navegar directamente a la conversación
        router.push(`/messages/${data.conversationId}`);
      } else {
        const data = await res.json();
        if (data.errorCode === 'NOT_CONTACT') {
          showNotification({
            type: 'info',
            title: 'Primero añade como contacto',
            message: 'Para enviar mensajes, primero debes añadir a esta persona como contacto.',
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Error al iniciar conversación',
            message: data.error || 'Inténtalo de nuevo.',
          });
        }
      }
    } catch (error) {
      console.error('Error al contactar:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all duration-200">
        {/* Header - Autor */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getAuthorImage() ? (
              <img
                src={getAuthorImage()}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getRoleColor()}`}>
                {getAuthorName()[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{getAuthorName()}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-500">{formatDate(post.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-500">{getAuthorLocation()}</p>
            </div>
          </div>

          {/* Botón eliminar (solo para el autor) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
              title="Eliminar publicación"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Contenido */}
        <p className="text-slate-700 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 mb-3">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={loading || isOwner}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm ${
              liked
                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                : 'text-slate-600 hover:text-red-600 hover:bg-red-50 bg-slate-50'
            } ${isOwner ? 'opacity-40 cursor-not-allowed' : ''} ${animatingLike ? 'scale-105' : ''}`}
          >
            <svg className="w-5 h-5" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{likesCount}</span>
          </button>

          {/* Comentarios */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm ${
              showComments
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-slate-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{commentsCount}</span>
          </button>

          {/* Compartir */}
          <button
            onClick={handleShare}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-slate-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 01-5.367 2.684m0 9.316a3 3 0 105.368 2.684 3 3 0 01-5.367-2.684" />
            </svg>
          </button>

          {/* Añadir como contacto (no para el propio autor) */}
          {!isOwner && (
            <AddContactButton
              userId={post.authorId}
              variant="icon"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 bg-slate-50"
              label="Añadir"
            />
          )}

          {/* Denunciar (no para el propio autor) */}
          {!isOwner && (
            <button
              onClick={handleReport}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 bg-slate-50"
              title="Denunciar publicación"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3z" />
              </svg>
            </button>
          )}
        </div>

        {/* Sección de comentarios */}
        {showComments && (
          <BoardCommentSection
            postId={post.id}
            onCommentAdd={() => {
              setCommentsCount(prev => prev + 1);
              onUpdate?.(post.id, { commentsCount: commentsCount + 1 });
            }}
            onCommentDelete={() => {
              setCommentsCount(prev => prev - 1);
              onUpdate?.(post.id, { commentsCount: commentsCount - 1 });
            }}
          />
        )}
      </div>
      <PromptDialogComponent />
      <ConfirmDialogComponent />
    </>
  );
}
