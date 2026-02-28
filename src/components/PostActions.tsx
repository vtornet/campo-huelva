// src/components/PostActions.tsx
// Componente de acciones sociales para publicaciones (Like, Compartir, Denunciar)

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/Notifications';
import { usePromptDialog } from '@/components/PromptDialog';

interface PostActionsProps {
  postId: string;
  initialLiked?: boolean;
  initialLikesCount?: number;
  initialSharesCount?: number;
  isOwner?: boolean;
  type?: 'OFFICIAL' | 'SHARED' | 'DEMAND';
  onLikeChange?: (liked: boolean, count: number) => void;
  size?: 'sm' | 'md';
}

export default function PostActions({
  postId,
  initialLiked = false,
  initialLikesCount = 0,
  initialSharesCount = 0,
  isOwner = false,
  type = 'OFFICIAL',
  onLikeChange,
  size = 'sm'
}: PostActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const { prompt, PromptDialogComponent } = usePromptDialog();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [sharesCount, setSharesCount] = useState(initialSharesCount);
  const [loading, setLoading] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isOwner) return;

    // Animación de like
    if (!liked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 300);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
        onLikeChange?.(data.liked, data.likesCount);
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

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.shared) {
          setSharesCount(data.sharesCount);

          // Texto según el tipo de publicación
          const shareText = type === 'DEMAND'
            ? 'Mira este candidato buscando empleo en Agro Red'
            : 'Mira esta oferta de empleo en Agro Red';

          const shareTitle = type === 'DEMAND'
            ? 'Agro Red - Candidato buscando empleo'
            : 'Agro Red - Oferta de empleo';

          const shareUrl = `${window.location.origin}/offer/${postId}`;

          // Función para copiar al portapapeles
          const copyToClipboard = async (): Promise<boolean> => {
            if (navigator.clipboard && window.isSecureContext) {
              try {
                await navigator.clipboard.writeText(shareUrl);
                return true;
              } catch (err) {
                console.error('Error con clipboard API:', err);
              }
            }
            // Fallback con execCommand
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              return successful;
            } catch (err) {
              document.body.removeChild(textArea);
              console.error('Error al copiar:', err);
              return false;
            }
          };

          // Intentar compartir con navigator.share
          if (navigator.share) {
            try {
              await navigator.share({
                title: shareTitle,
                text: shareText,
                url: shareUrl
              });
              // Si share funcionó, ya terminamos
              return;
            } catch (shareError: any) {
              // Si el usuario canceló, no hacer nada más
              if (shareError.name === 'AbortError') {
                return;
              }
              // Si hay otro error, intentar copiar al portapapeles
              console.log('navigator.share falló, intentando copiar al portapapeles:', shareError);
            }
          }

          // Si no hay navigator.share o falló, copiar al portapapeles
          const copied = await copyToClipboard();
          if (copied) {
            showNotification({
              type: 'success',
              title: '¡Enlace copiado!',
              message: 'Ya puedes compartirlo con quien quieras.',
            });
          } else {
            showNotification({
              type: 'warning',
              title: 'No se pudo copiar',
              message: `Copia esta URL manualmente: ${shareUrl}`,
              duration: 6000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error al compartir:', error);
    } finally {
      setLoading(false);
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
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedPostId: postId,
          reason,
          description,
          reporterId: user.uid
        })
      });

      if (res.ok) {
        showNotification({
          type: 'success',
          title: 'Denuncia enviada',
          message: 'Gracias por ayudarnos a mantener la comunidad segura. Revisaremos tu reporte.',
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

  // Diseño responsive: más grande en móvil
  const buttonClass = "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 font-medium";
  const iconClass = "w-6 h-6";
  const textClass = "text-xs";

  return (
    <>
    <div className="flex items-center gap-2 w-full">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={loading || isOwner}
        className={`${buttonClass} ${
          liked
            ? 'text-red-600 bg-red-50 hover:bg-red-100 shadow-sm shadow-red-100'
            : 'text-slate-600 hover:text-red-600 hover:bg-red-50 bg-slate-50'
        } ${isOwner ? 'opacity-40 cursor-not-allowed' : ''} ${animatingLike ? 'scale-110' : ''}`}
      >
        <svg className={iconClass} fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <span className={textClass}>{likesCount} Me gusta</span>
      </button>

      {/* Compartir */}
      <button
        onClick={handleShare}
        disabled={loading}
        className={`${buttonClass} text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-slate-50`}
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        <span className={textClass}>{sharesCount} Compartir</span>
      </button>

      {/* Denunciar */}
      <button
        onClick={handleReport}
        disabled={loading || isOwner}
        className={`${buttonClass} text-slate-600 hover:text-amber-600 hover:bg-amber-50 bg-slate-50 ${
          isOwner ? 'opacity-40 cursor-not-allowed' : ''
        }`}
        title="Denunciar publicación"
      >
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v1.5M3 21v-6m0 0l2.25-.77a2.25 2.25 0 012.5.77l.025.064a48.36 48.36 0 005.937-2.89l.023-.01a2.25 2.25 0 011.94.164l2.25.913a2.25 2.25 0 001.676.03l6.5-2.29V3M3 3l18 9" />
        </svg>
        <span className={textClass}>Denunciar</span>
      </button>
    </div>
    <PromptDialogComponent />
    </>
  );
}
