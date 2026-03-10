"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EmailVerificationBanner() {
  const { user, sendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  // No mostrar si no hay usuario, si ya está verificado, o si fue cerrado
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      alert("Email de verificación enviado. Revisa tu bandeja de entrada.");
    } catch (error) {
      console.error("Error al enviar email:", error);
      alert("Error al enviar el email. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-yellow-800">
            <strong>Verifica tu email</strong> para acceder a todas las funcionalidades.
            <button
              onClick={() => router.push("/verify-email")}
              className="ml-2 underline hover:text-yellow-900"
            >
              Más información
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-sm bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 transition disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Reenviar"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
