"use client";

import { useEffect, useState } from "react";

interface VerificationLinkModalProps {
  isOpen: boolean;
  link: string;
  onClose: () => void;
}

export default function VerificationLinkModal({ isOpen, link, onClose }: VerificationLinkModalProps) {
  const [copied, setCopied] = useState(false);

  // Copiar enlace al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // Abrir enlace en nueva pestaña
  const openLink = () => {
    window.open(link, "_blank");
  };

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icono de advertencia */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Título y mensaje */}
        <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
          No se pudo enviar el email
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Has realizado demasiadas solicitudes. Usa el siguiente enlace para verificar tu email:
        </p>

        {/* Enlace */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">Enlace de verificación:</p>
          <p className="text-sm text-gray-800 break-all font-mono">
            {link}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-200 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
          <button
            onClick={openLink}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 px-4 rounded-md hover:bg-emerald-700 transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir enlace
          </button>
        </div>

        {/* Mensaje inferior */}
        <p className="text-xs text-gray-500 text-center mt-4">
          El enlace expirará en 24 horas. También puedes reintentar en unos minutos.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook para gestionar el modal de enlace de verificación
 */
export function useVerificationLinkModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [link, setLink] = useState("");

  const showModal = (verificationLink: string) => {
    setLink(verificationLink);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    link,
    showModal,
    hideModal,
    modalComponent: (
      <VerificationLinkModal
        isOpen={isOpen}
        link={link}
        onClose={hideModal}
      />
    )
  };
}
