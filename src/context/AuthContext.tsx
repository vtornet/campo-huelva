"use client"; // Esto es obligatorio porque usamos hooks de React

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

// Definimos qué datos vamos a compartir
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// El componente que envolverá a toda la app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

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
        console.log("AuthProvider: Estado de auth cambió:", currentUser ? "Usuario autenticado" : "No hay usuario");
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
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => useContext(AuthContext);