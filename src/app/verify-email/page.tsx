"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useVerificationLinkModal } from "@/components/VerificationLinkModal";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, reloadUser, sendVerificationEmail } = useAuth();
  const { showModal, hideModal, modalComponent } = useVerificationLinkModal();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Si no hay usuario o ya está verificado, redirigir
  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.emailVerified) {
      router.push("/");
    }
  }, [user, router]);

  const handleResendEmail = async () => {
    setLoading(true);
    setMessage("");

    try {
      const result = await sendVerificationEmail();

      if (result.emailSent) {
        // Email enviado correctamente por Resend
        setMessage("✅ Email de verificación enviado. Revisa tu bandeja de entrada.");
        setMessageType("success");
      } else if (result.link) {
        // No se pudo enviar el email, mostrar el enlace manualmente
        showModal(result.link);
        setMessage("⚠️ No se pudo enviar el email automáticamente. Usa el enlace del modal.");
        setMessageType("error");
      } else {
        setMessage(result.error || "Error al enviar el email.");
        setMessageType("error");
      }
    } catch (error: any) {
      console.error("Error al enviar email:", error);
      setMessage("Error al enviar el email. Inténtalo de nuevo más tarde.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    await reloadUser();
    setLoading(false);

    if (user?.emailVerified) {
      router.push("/");
    }
  };

  if (!user) return null;

  return (
    <>
      {modalComponent}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Agro Red"
              width={180}
              height={52}
              priority
            />
          </div>

          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifica tu email</h1>
            <p className="text-gray-600">
              Hemos enviado un email de verificación a <strong>{user.email}</strong>
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong>
            </p>
            <ol className="text-sm text-blue-700 list-decimal list-inside mt-2 space-y-1">
              <li>Abre tu bandeja de entrada</li>
              <li>Busca el email de Agro Red</li>
              <li>Haz clic en el enlace de verificación</li>
              <li>Vuelve aquí y pulsa "Continuar"</li>
            </ol>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              messageType === "success"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verificando..." : "Continuar"}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Reenviar email de verificación"}
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition"
            >
              Saltar por ahora
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Si no recibes el email en unos minutos, revisa tu carpeta de spam o pulsa "Reenviar" para obtener un enlace manual.
          </p>
        </div>
      </div>
    </>
  );
}
