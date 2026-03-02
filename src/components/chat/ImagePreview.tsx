import React from "react";

interface ImagePreviewProps {
  url: string;
  onRemove: () => void;
}

export function ImagePreview({ url, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative inline-flex items-center gap-3 p-2 bg-slate-100 rounded-2xl">
      <img
        src={url}
        alt="Vista previa"
        className="h-16 w-16 object-cover rounded-xl"
      />
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 bg-white rounded-full text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
        title="Eliminar imagen"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
