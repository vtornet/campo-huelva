"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RequireEmailVerificationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Componente que restringe el acceso a funcionalidades si el email no está verificado.
 *
 * Opciones:
 * - Sin props: Muestra un mensaje de error si no está verificado
 * - fallback: Muestra un componente personalizado en lugar del error
 * - redirectTo: Redirige a otra página si no está verificado
 */
export default function RequireEmailVerification({
  children,
  fallback,
  redirectTo,
}: RequireEmailVerificationProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Si hay redirectTo y el email no está verificado, redirigir
  useEffect(() => {
    if (redirectTo && user && !user.emailVerified) {
      router.push(redirectTo);
    }
  }, [user, redirectTo, router]);

  // Si el usuario está autenticado y el email está verificado, mostrar hijos
  if (user && user.emailVerified) {
    return <>{children}</>;
  }

  // Si hay un fallback personalizado, mostrarlo
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si no hay fallback y no hay redirect, mostrar mensaje de error
  if (user && !user.emailVerified && !redirectTo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-yellow-800 font-medium">Debes verificar tu email para usar esta funcionalidad.</p>
        <p className="text-yellow-700 text-sm mt-1">
          Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
        </p>
        <button
          onClick={() => router.push("/verify-email")}
          className="mt-3 text-sm bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition"
        >
          Ir a verificación
        </button>
      </div>
    );
  }

  // Si no hay usuario, mostrar los hijos (para evitar flash de contenido)
  return <>{children}</>;
}

/**
 * Hook para comprobar si el email está verificado
 * Útil para deshabilitar botones o mostrar condicionalmente
 */
export function useEmailVerification() {
  const { user } = useAuth();

  return {
    isVerified: user?.emailVerified ?? false,
    needsVerification: user && !user.emailVerified,
    canShowRestrictedContent: user?.emailVerified ?? false,
  };
}
