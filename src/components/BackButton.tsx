'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCallback } from 'react';

interface BackButtonProps {
  href?: string;  // Si se proporciona, usa Link. Si no, usa router.back()
  label?: string;
  className?: string;
}

/**
 * Botón de volver reutilizable.
 * Si se proporciona href, navega a esa ruta.
 * Si no, usa router.back() para volver a la página anterior.
 */
export function BackButton({ href, label = 'Volver', className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  }, [href, router]);

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}

/**
 * Botón de volver con estilo de página (para usar en header de páginas).
 */
export function PageBackButton({ href, label = 'Volver' }: Omit<BackButtonProps, 'className'>) {
  return (
    <div className="mb-6">
      <BackButton href={href} label={label} className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400" />
    </div>
  );
}
