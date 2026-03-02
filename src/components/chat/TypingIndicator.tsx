import React from "react";

interface TypingIndicatorProps {
  names?: string[]; // Nombres de usuarios que están escribiendo
  className?: string;
}

/**
 * Componente que muestra un indicador de "escribiendo..." con animación
 * Muestra puntos animados para indicar que alguien está escribiendo
 */
export function TypingIndicator({ names, className = "" }: TypingIndicatorProps) {
  const getText = () => {
    if (!names || names.length === 0) {
      return "Alguien está escribiendo...";
    }
    if (names.length === 1) {
      return `${names[0]} está escribiendo...`;
    }
    if (names.length === 2) {
      return `${names[0]} y ${names[1]} están escribiendo...`;
    }
    return "Varios están escribiendo...";
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-3 ${className}`}>
      {/* Burbuja de indicador */}
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl px-3 py-2">
        {/* Puntos animados */}
        <div className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {getText()}
        </span>
      </div>
    </div>
  );
}

/**
 * Componente compacto del indicador de escritura
 * Para usar en el área de mensajes
 */
export function CompactTypingIndicator({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-white rounded-full px-3 py-1.5 shadow-sm border border-slate-200">
        <span className="text-slate-400 text-xs">Escribiendo</span>
        <div className="flex items-center gap-0.5">
          <span
            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
