// src/components/AIBioGenerator.tsx
// Componente de textarea con botón para generar bio con IA

'use client';

import React, { useState } from 'react';
import AIButton, { AIBadge } from './AIButton';

interface AIBioGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  rol: 'USER' | 'WORKER' | 'FOREMAN' | 'ENGINEER';
  profileData?: Record<string, any>;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function AIBioGenerator({
  value,
  onChange,
  rol,
  profileData = {},
  placeholder = "Cuéntanos sobre tu experiencia y habilidades...",
  label = "Sobre ti",
  className = "",
}: AIBioGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generarConIA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/profile-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol,
          ...profileData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar descripción');
      }

      const data = await response.json();
      onChange(data.descripcion);
    } catch (err: any) {
      console.error('Error generando descripción:', err);
      const errorMsg = err.message || 'Error al generar la descripción';
      setError(errorMsg);

      // Mostrar mensaje amigable si es por falta de API key
      if (errorMsg.includes('IA no disponible') || errorMsg.includes('GEMINI_API_KEY')) {
        setError('La función de IA no está disponible. Contacta con el administrador.');
      } else {
        setError('Error al generar la descripción. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <AIBadge />
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
        />
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{value.length} caracteres</span>
        <AIButton
          onClick={generarConIA}
          loading={loading}
          label="Generar con IA"
          className="text-xs px-3 py-1.5"
        />
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-amber-700 text-sm">{error}</p>
        </div>
      )}

      {value && !error && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <p className="text-emerald-700 text-sm whitespace-pre-wrap">{value}</p>
        </div>
      )}
    </div>
  );
}
