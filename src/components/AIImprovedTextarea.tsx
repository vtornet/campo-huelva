// src/components/AIImprovedTextarea.tsx
// Componente de textarea con botón para mejorar descripción con IA

'use client';

import { useState } from 'react';
import AIButton, { AIBadge } from './AIButton';

interface AIImprovedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  titulo?: string;
  provincia?: string;
  tipo?: string;
  placeholder?: string;
  label?: string;
  rows?: number;
  required?: boolean;
  className?: string;
}

export default function AIImprovedTextarea({
  value,
  onChange,
  titulo = '',
  provincia = '',
  tipo = '',
  placeholder = "Describe los detalles...",
  label = "Descripción detallada",
  rows = 5,
  required = false,
  className = '',
}: AIImprovedTextareaProps) {
  const [loading, setLoading] = useState(false);

  const mejorarConIA = async () => {
    if (!value.trim()) {
      alert('Escribe primero un texto básico para que la IA pueda mejorarlo.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/improve-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descripcion: value,
          provincia,
          tipo,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al mejorar la descripción');
      }

      const data = await response.json();

      // Mostrar comparación
      if (confirm(`Descripción mejorada:\n\n"${data.improved}"\n\n¿Quieres reemplazar tu texto actual con esta versión mejorada?`)) {
        onChange(data.improved);
      }
    } catch (error) {
      console.error('Error mejorando descripción:', error);
      alert('Error al mejorar la descripción. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <AIBadge />
      </div>

      <textarea
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{value.length} caracteres</span>
        <AIButton
          onClick={mejorarConIA}
          loading={loading}
          disabled={!value.trim()}
          label="Mejorar con IA"
          className="text-xs px-3 py-1.5"
        />
      </div>
    </div>
  );
}
