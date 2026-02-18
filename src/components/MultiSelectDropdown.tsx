// src/components/MultiSelectDropdown.tsx
// Componente de desplegable multiselección con badges de selección

'use client';

import { useState, useRef, useEffect } from 'react';

interface MultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  allLabel?: string;
  className?: string;
  color?: 'emerald' | 'orange' | 'slate';
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  allLabel = 'Todas',
  className = '',
  color = 'slate',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Colores según el tema
  const colors = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-700',
      badgeRemove: 'hover:bg-emerald-200',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      badgeRemove: 'hover:bg-orange-200',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-700',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      badgeRemove: 'hover:bg-slate-200',
    },
  };

  const theme = colors[color];

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Alternar selección de una opción
  const toggleOption = (option: string) => {
    if (option === allLabel) {
      // Si selecciona "Todas", limpiamos o seleccionamos todo
      if (selected.length > 0) {
        onChange([]);
      } else {
        onChange(options);
      }
      return;
    }

    const newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option];

    onChange(newSelected);
  };

  // Eliminar una opción seleccionada
  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(s => s !== option));
  };

  // Limpiar todas las selecciones
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Texto a mostrar en el botón
  const getDisplayText = () => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0];
    return `${selected.length} seleccionados`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Botón del dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${theme.bg} ${theme.border} border rounded-xl px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-all duration-200 hover:shadow-sm`}
      >
        <span className={`${theme.text} font-medium text-sm truncate`}>
          {getDisplayText()}
        </span>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className={`${theme.text} hover:bg-white/50 rounded-full p-1 transition-colors`}
              title="Limpiar selección"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-5 h-5 ${theme.text} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Lista desplegable */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-500/20 max-h-64 overflow-y-auto">
          {/* Opción "Todas" */}
          <button
            type="button"
            onClick={() => {
              toggleOption(allLabel);
              if (selected.length === 0 || selected.length === options.length) {
                setIsOpen(false);
              }
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-slate-100 ${
              selected.length === 0 || selected.length === options.length
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                selected.length === 0 || selected.length === options.length
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-300'
              }`}>
                {(selected.length === 0 || selected.length === options.length) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span>{allLabel}</span>
            </div>
          </button>

          {/* Opciones individuales */}
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                toggleOption(option);
                // No cerramos automáticamente para permitir multiselección rápida
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                selected.includes(option)
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selected.includes(option)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-300'
                }`}>
                  {selected.includes(option) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Badges de selección (opcional, para mostrar seleccionados abajo) */}
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.slice(0, 5).map((sel) => (
            <span
              key={sel}
              className={`${theme.badgeBg} ${theme.badgeText} ${theme.badgeRemove} px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors`}
            >
              {sel}
              <button
                onClick={(e) => removeOption(sel, e)}
                className="hover:text-red-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
          {selected.length > 5 && (
            <span className={`${theme.badgeBg} ${theme.badgeText} px-3 py-1 rounded-full text-xs font-medium`}>
              +{selected.length - 5} más
            </span>
          )}
        </div>
      )}
    </div>
  );
}
