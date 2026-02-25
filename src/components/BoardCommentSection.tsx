// src/components/BoardCommentSection.tsx
// Sección de comentarios anidados para el Tablón Social

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/Notifications';
import { usePromptDialog } from '@/components/PromptDialog';
import { useConfirmDialog } from '@/components/ConfirmDialog';

interface Profile {
  fullName?: string;
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

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  parentId: string | null;
  liked?: boolean;
  likesCount: number;
  author: Author;
  replies?: Comment[];
}

interface BoardCommentSectionProps {
  postId: string;
  onCommentAdd?: () => void;
  onCommentDelete?: () => void;
}

export default function BoardCommentSection({
  postId,
  onCommentAdd,
  onCommentDelete
}: BoardCommentSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null); // ID del comentario que se está respondiendo
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/board-posts/${postId}/comments?currentUserId=${user?.uid || ''}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error cargando comentarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/board-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (res.ok) {
        setNewComment('');
        onCommentAdd?.();
        loadComments();
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo publicar el comentario.',
        });
      }
    } catch (error) {
      console.error('Error publicando comentario:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/board-posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parentId: commentId
        })
      });

      if (res.ok) {
        setReplyText('');
        setReplyTo(null);
        onCommentAdd?.();
        loadComments();
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo publicar la respuesta.',
        });
      }
    } catch (error) {
      console.error('Error publicando respuesta:', error);
      showNotification({
        type: 'error',
        title: 'Error de conexión',
        message: 'Verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/board-comments/${commentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Actualizar estado local
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              liked: data.liked,
              likesCount: data.likesCount
            };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? { ...reply, liked: data.liked, likesCount: data.likesCount }
                  : reply
              )
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: 'Eliminar comentario',
      message: '¿Estás seguro de que quieres eliminar este comentario?',
      type: 'danger',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/board-comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (res.ok) {
        onCommentDelete?.();
        loadComments();
        showNotification({
          type: 'success',
          title: 'Comentario eliminado',
          message: 'El comentario ha sido eliminado correctamente.',
        });
      } else {
        const data = await res.json();
        showNotification({
          type: 'error',
          title: 'Error',
          message: data.error || 'No se pudo eliminar el comentario.',
        });
      }
    } catch (error) {
      console.error('Error eliminando comentario:', error);
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const reason = await prompt({
      title: 'Denunciar comentario',
      message: '¿Por qué denunciás este comentario?',
      placeholder: 'Razón de la denuncia...',
      type: 'warning',
      required: true,
    });
    if (!reason) return;

    try {
      const res = await fetch('/api/board/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          type: 'COMMENT',
          commentId,
          reason
        })
      });

      if (res.ok) {
        showNotification({
          type: 'success',
          title: 'Denuncia enviada',
          message: 'Gracias por ayudarnos a mantener la comunidad segura.',
        });
      }
    } catch (error) {
      console.error('Error al denunciar:', error);
    }
  };

  // Funciones auxiliares
  const getAuthorName = (author: Author) => {
    const profile = author.workerProfile
      || author.foremanProfile
      || author.engineerProfile
      || author.encargadoProfile
      || author.tractoristProfile;
    return profile?.fullName || 'Usuario';
  };

  const getAuthorImage = (author: Author) => {
    const profile = author.workerProfile
      || author.foremanProfile
      || author.engineerProfile
      || author.encargadoProfile
      || author.tractoristProfile;
    return profile?.profileImage;
  };

  const getAuthorInitial = (author: Author) => {
    return getAuthorName(author)[0];
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'FOREMAN': return 'from-orange-400 to-orange-500';
      case 'ENGINEER': return 'from-blue-400 to-blue-500';
      case 'ENCARGADO': return 'from-purple-400 to-purple-500';
      case 'TRACTORISTA': return 'from-cyan-400 to-cyan-500';
      default: return 'from-green-400 to-green-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.uid === comment.authorId;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-8 mt-2' : 'mt-3'} ${isReply ? 'border-l-2 border-slate-100 pl-3' : ''}`}
      >
        <div className="flex items-start gap-2">
          {/* Avatar */}
          {getAuthorImage(comment.author) ? (
            <img
              src={getAuthorImage(comment.author)}
              alt="Avatar"
              className={`w-8 h-8 rounded-full object-cover ${isReply ? 'w-6 h-6' : ''}`}
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${getRoleColor(comment.author.role)} ${isReply ? 'w-6 h-6' : ''}`}>
              {getAuthorInitial(comment.author)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Nombre y fecha */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-800">{getAuthorName(comment.author)}</span>
              <span className="text-xs text-slate-400">{formatDate(comment.createdAt)}</span>

              {/* Acciones */}
              <div className="flex items-center gap-1 ml-auto">
                {/* Like */}
                <button
                  onClick={() => handleLikeComment(comment.id)}
                  className={`p-1 rounded ${comment.liked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'} transition-colors`}
                  title="Me gusta"
                >
                  <svg className="w-4 h-4" fill={comment.liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {comment.likesCount > 0 && (
                  <span className="text-xs text-slate-500">{comment.likesCount}</span>
                )}

                {/* Responder (solo comentarios principales) */}
                {!isReply && (
                  <button
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    className="p-1 rounded text-slate-400 hover:text-blue-500 transition-colors"
                    title="Responder"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                )}

                {/* Denunciar (no propio) */}
                {!isOwner && (
                  <button
                    onClick={() => handleReportComment(comment.id)}
                    className="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors"
                    title="Denunciar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3z" />
                    </svg>
                  </button>
                )}

                {/* Eliminar (propietario) */}
                {isOwner && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <p className="text-sm text-slate-700 mt-1">{comment.content}</p>

            {/* Input de respuesta */}
            {replyTo === comment.id && !isReply && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !submitting) {
                      handleSubmitReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyText.trim()}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? '...' : '→'}
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText('');
                  }}
                  className="px-3 py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Respuestas */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 space-y-2">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border-t border-slate-100 pt-4">
        {/* Nuevo comentario */}
        {user ? (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !submitting) {
                  handleSubmitComment();
                }
              }}
              disabled={submitting}
            />
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {submitting ? '...' : 'Enviar'}
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-sm text-slate-500">
            <a href="/login" className="text-blue-500 hover:underline">Inicia sesión</a> para comentar
          </div>
        )}

        {/* Lista de comentarios */}
        {loading ? (
          <div className="text-center py-4 text-sm text-slate-500">Cargando comentarios...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-500">
            Sé el primero en comentar
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
      <PromptDialogComponent />
      <ConfirmDialogComponent />
    </>
  );
}
