// src/components/AIButton.tsx
// Componente de botón con icono de IA para generar descripciones automáticamente

'use client';

import React, { useState } from 'react';

interface AIButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function AIButton({
  onClick,
  loading = false,
  disabled = false,
  label = 'Generar con IA',
  className = '',
}: AIButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (!loading && !disabled) {
      setIsClicked(true);
      onClick();
      setTimeout(() => setIsClicked(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200
        ${loading || disabled
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:scale-105'
        }
        ${isClicked && !loading && 'ring-2 ring-purple-400 ring-offset-2'}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

/**
 * Componente de badge pequeño para indicar que una característica usa IA
 */
export function AIBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`
      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700
      ${className}
    `}>
      <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      IA
    </span>
  );
}
