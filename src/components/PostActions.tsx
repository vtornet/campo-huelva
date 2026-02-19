// src/components/PostActions.tsx
// Componente de acciones sociales para publicaciones (Like, Compartir, Denunciar)

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

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
            ? 'Mira este candidato buscando empleo en Red Agro'
            : 'Mira esta oferta de empleo en Red Agro';

          const shareTitle = type === 'DEMAND'
            ? 'Red Agro - Candidato buscando empleo'
            : 'Red Agro - Oferta de empleo';

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
            alert('¡Enlace copiado al portapapeles!');
          } else {
            alert('No se pudo copiar el enlace. Por favor, copia esta URL:\n' + shareUrl);
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
      alert('No puedes denunciar tu propia publicación');
      return;
    }

    const reason = prompt('Razón de la denuncia:');
    if (!reason) return;

    const description = prompt('Descripción adicional (opcional):');

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
        alert('Denuncia enviada correctamente. Gracias por ayudarnos a mantener la comunidad segura.');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al enviar denuncia');
      }
    } catch (error) {
      console.error('Error al denunciar:', error);
      alert('Error al enviar denuncia');
    } finally {
      setLoading(false);
    }
  };

  // Diseño responsive: más grande en móvil
  const buttonClass = "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 font-medium";
  const iconClass = "w-6 h-6";
  const textClass = "text-xs";

  return (
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 01-5.367 2.684m0 9.316a3 3 0 105.368 2.684 3 3 0 01-5.367-2.684" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3z" />
        </svg>
        <span className={textClass}>Denunciar</span>
      </button>
    </div>
  );
}
