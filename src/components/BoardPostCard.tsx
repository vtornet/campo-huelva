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

    // Usar la nueva URL dedicada para OG
    const shareUrl = `${window.location.origin}/board/${post.id}`;
    const shareText = `Mira esta publicación de ${getAuthorName()} en Agro Red`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agro Red - Publicación de ${getAuthorName()}`,
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
          'Authorization': `Bearer ${await user.getIdToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user.uid })
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

    // Verificar email antes de permitir contactar
    if (!user.emailVerified) {
      showNotification({
        type: 'warning',
        title: 'Email no verificado',
        message: 'Debes verificar tu email para contactar con otros usuarios.',
      });
      router.push('/verify-email');
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

  // Formatear fecha en formato: "Publicado el 01/02/26 a las 17:23"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return '';
    }

    // Formatear fecha: DD/MM/YY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Últimos 2 dígitos

    // Formatear hora: HH:mm
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `Publicado el ${day}/${month}/${year} a las ${hours}:${minutes}`;
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/user/${post.authorId}`);
                  }}
                  className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-all cursor-pointer"
                >
                  {getAuthorName()}
                </button>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641l-.417 1.666c-.238.953.766 1.746 1.605 1.265l1.905-1.076c.465-.263.998-.36 1.526-.272 1.18.196 2.425.145 3.522-.204z" />
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>

          {/* Denunciar (no para el propio autor) */}
          {!isOwner && (
            <button
              onClick={handleReport}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-200 font-medium text-sm text-slate-600 hover:text-amber-600 hover:bg-amber-50 bg-slate-50"
              title="Denunciar publicación"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v1.5M3 21v-6m0 0l2.25-.77a2.25 2.25 0 012.5.77l.025.064a48.36 48.36 0 005.937-2.89l.023-.01a2.25 2.25 0 011.94.164l2.25.913a2.25 2.25 0 001.676.03l6.5-2.29V3M3 3l18 9" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón separado: Añadir como contacto (no para el propio autor) */}
        {!isOwner && (
          <div className="mb-3">
            <AddContactButton
              userId={post.authorId}
              variant="button"
              className="w-full"
              label="Añadir Contacto"
            />
          </div>
        )}

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
