"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validación básica
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Por favor, introduce un email válido.");
      setMessageType("error");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el email");
      }

      setEmailSent(true);
      setMessage(data.message || "Si el email está registrado, recibirás un enlace.");
      setMessageType("success");
    } catch (error: any) {
      console.error("Error al enviar email:", error);
      setMessage(error.message || "Error al enviar el email. Inténtalo de nuevo más tarde.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            emailSent ? "bg-green-100" : "bg-blue-100"
          }`}>
            {emailSent ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {emailSent ? "Email enviado" : "¿Olvidaste tu contraseña?"}
          </h1>
          <p className="text-gray-600">
            {emailSent
              ? "Hemos enviado un email con las instrucciones para restablecer tu contraseña."
              : "Introduce tu email y te enviaremos un enlace para restablecer tu contraseña."}
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}>
            {message}
          </div>
        )}

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                setEmailSent(false);
                setEmail("");
                setMessage("");
              }}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium"
            >
              Reenviar email
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition font-medium"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          El enlace expirará en 1 hora. Si no recibes el email, revisa tu carpeta de spam.
        </p>
      </div>
    </div>
  );
}
