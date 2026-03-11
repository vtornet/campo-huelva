"use client"; // Esto es obligatorio porque usamos hooks de React

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User, reload } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Resultado de enviar email de verificación
interface VerificationEmailResult {
  success: boolean;
  link?: string; // Enlace de verificación (siempre disponible)
  emailSent?: boolean; // Si se envió correctamente por Resend
  emailError?: string; // Error del envío de email (si hubo)
  error?: string; // Error general
}

// Definimos qué datos vamos a compartir
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string;
  sendVerificationEmail: () => Promise<VerificationEmailResult>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sendVerificationEmail: async () => ({ success: false }),
  reloadUser: async () => {}
});

// El componente que envolverá a toda la app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Función para enviar email de verificación
  // Usa el endpoint API que genera el enlace con Firebase Admin y lo envía con Resend
  const sendVerificationEmail = async (): Promise<VerificationEmailResult> => {
    if (!auth?.currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    // Usar el endpoint API para generar y enviar el email
    const token = await auth.currentUser.getIdToken();
    try {
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar email");
      }

      console.log("[AuthContext] Respuesta del API:", data);

      // Devolvemos la respuesta tal cual del API
      return {
        success: data.success,
        link: data.link,
        emailSent: data.emailSent,
        emailError: data.emailError,
      };
    } catch (error: any) {
      console.error("[AuthContext] Error al llamar al API:", error);
      return {
        success: false,
        error: error.message || "Error al generar enlace de verificación"
      };
    }
  };

  // Función para recargar el usuario (actualizar emailVerified)
  const reloadUser = async () => {
    if (!auth?.currentUser) return;
    await reload(auth.currentUser);
    setUser(auth.currentUser);
  };

  useEffect(() => {
    // Verificar que auth esté inicializado
    if (!auth) {
      console.error("Firebase Auth no está inicializado");
      setError("Error de configuración de Firebase");
      setLoading(false);
      return;
    }

    console.log("AuthProvider: Iniciando observador de auth...");

    try {
      // Suscribirse a los cambios de autenticación de Firebase
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        console.log("AuthProvider: Estado de auth cambió:", currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        } : "No hay usuario");
        setUser(currentUser);
        setLoading(false);
      }, (err) => {
        console.error("AuthProvider: Error en onAuthStateChanged:", err);
        setError(err.message);
        setLoading(false);
      });

      // Limpiar suscripción al desmontar
      return () => {
        console.log("AuthProvider: Limpiando suscripción");
        unsubscribe();
      };
    } catch (err) {
      console.error("AuthProvider: Error al configurar auth:", err);
      setError("Error al configurar autenticación");
      setLoading(false);
    }
  }, []);

  // Recargar usuario automáticamente cada 30s si no ha verificado email
  useEffect(() => {
    if (!user || user.emailVerified) return;

    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        setUser(auth.currentUser);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user]);

  // Mientras carga, mostramos un spinner. Cuando termina, mostramos los hijos.
  // Importante: SIEMPRE renderizamos algo, nunca dejamos la pantalla en blanco.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, sendVerificationEmail, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => useContext(AuthContext);