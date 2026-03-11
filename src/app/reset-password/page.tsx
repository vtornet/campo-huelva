"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  // Verificar el código al cargar la página
  useEffect(() => {
    // No verificar si ya cambiamos la contraseña o si estamos en proceso de cambio
    if (passwordChanged) {
      return;
    }

    if (!oobCode) {
      setCodeValid(false);
      setMessage("Enlace inválido o expirado.");
      setMessageType("error");
      return;
    }

    const verifyCode = async () => {
      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setCodeValid(true);
      } catch (error: any) {
        console.error("Error al verificar código:", error);
        setCodeValid(false);
        setMessage(
          error.code === "auth/expired-action-code"
            ? "El enlace ha expirado. Solicita un nuevo enlace."
            : error.code === "auth/invalid-action-code"
            ? "Enlace inválido. Solicita un nuevo enlace."
            : "Error al verificar el enlace."
        );
        setMessageType("error");
      }
    };

    verifyCode();
  }, [oobCode, passwordChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // Validaciones
    if (password.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode!, password);

      // Marcar como cambiado para evitar re-verificar el código
      setPasswordChanged(true);

      setMessage("✅ Contraseña restablecida correctamente.");
      setMessageType("success");

      // Redirigir inmediatamente al login
      router.push("/login");
    } catch (error: any) {
      console.error("Error al restablecer contraseña:", error);
      setMessage(
        error.code === "auth/expired-action-code"
          ? "El enlace ha expirado. Solicita un nuevo enlace."
          : error.code === "auth/invalid-action-code"
          ? "Enlace inválido. Solicita un nuevo enlace."
          : "Error al restablecer la contraseña. Inténtalo de nuevo."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Si la contraseña ya se cambió, mostrar pantalla de éxito
  if (passwordChanged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Contraseña restablecida!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // Loading mientras se verifica el código
  if (codeValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verificando enlace...</p>
        </div>
      </div>
    );
  }

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
            codeValid ? "bg-emerald-100" : "bg-red-100"
          }`}>
            {codeValid ? (
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {codeValid ? "Restablecer contraseña" : "Enlace inválido"}
          </h1>
          {codeValid && email && (
            <p className="text-gray-600 text-sm">
              Para: <strong>{email}</strong>
            </p>
          )}
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

        {codeValid && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                placeholder="Repite tu contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Restableciendo..." : "Restablecer contraseña"}
            </button>
          </form>
        )}

        {!codeValid && (
          <div className="space-y-3">
            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition font-medium"
            >
              Solicitar nuevo enlace
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
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
