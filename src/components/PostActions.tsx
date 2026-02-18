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

  const handleLike = async () => {
    if (!user) {
      router.push('/login');
      return;
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
          // Copiar enlace al portapapeles
          if (navigator.share) {
            await navigator.share({
              title: 'Red Agro - Oferta de empleo',
              text: 'Mira esta oferta de empleo en Red Agro',
              url: `${window.location.origin}/offer/${postId}`
            });
          } else {
            // Fallback: copiar al portapapeles
            await navigator.clipboard.writeText(`${window.location.origin}/offer/${postId}`);
            alert('¡Enlace copiado al portapapeles!');
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

  // Tamaños de iconos
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5';

  return (
    <div className="flex items-center gap-2">
      {/* Like */}
      <button
        onClick={handleLike}
        disabled={loading || isOwner}
        className={`flex items-center gap-1.5 ${textSize} font-medium rounded-lg transition-all duration-200 ${
          liked
            ? 'text-red-600 bg-red-50 hover:bg-red-100'
            : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
        } ${isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className={iconSize} fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span>{likesCount}</span>
      </button>

      {/* Compartir */}
      <button
        onClick={handleShare}
        disabled={loading}
        className={`flex items-center gap-1.5 ${textSize} font-medium rounded-lg transition-all duration-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50`}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 01-5.367 2.684m0 9.316a3 3 0 105.368 2.684 3 3 0 01-5.367-2.684" />
        </svg>
        <span>{sharesCount}</span>
      </button>

      {/* Denunciar */}
      <button
        onClick={handleReport}
        disabled={loading || isOwner}
        className={`flex items-center gap-1.5 ${textSize} font-medium rounded-lg transition-all duration-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 ${
          isOwner ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Denunciar publicación"
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3z" />
        </svg>
      </button>
    </div>
  );
}
