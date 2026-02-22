/**
 * Componente de diálogo de confirmación personalizado
 * Reemplaza al confirm() del navegador
 */

"use client";

import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info" | "success";
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "info"
}: ConfirmDialogProps) {
  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      title: "text-red-800",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: "text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "text-blue-800",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      title: "text-emerald-800",
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
  };

  const style = styles[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className={`${style.bg} ${style.border} border rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scaleIn`}>
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.bg} flex items-center justify-center`}>
            {type === "danger" && (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0z" />
              </svg>
            )}
            {type === "warning" && (
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0z" />
              </svg>
            )}
            {type === "info" && (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {type === "success" && (
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${style.title} mb-2`}>
              {title}
            </h3>
            <p className="text-slate-700 whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl transition-all font-medium ${style.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook para usar el diálogo de confirmación
 */
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    type: "danger" | "warning" | "info" | "success";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "info",
  });

  const confirm = ({
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = "info"
  }: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info" | "success";
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  const handleCancel = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      type={dialog.type}
      onConfirm={() => dialog.onConfirm?.()}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogComponent };
}
