"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Onboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Aceptamos ahora FOREMAN también
  const handleSelectRole = async (role: "WORKER" | "COMPANY" | "FOREMAN") => {
    if (!user) return;
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role,
        }),
      });

      if (response.ok) {
        if (role === "WORKER") router.push("/profile/worker");
        else if (role === "FOREMAN") router.push("/profile/foreman"); // <--- NUEVA RUTA
        else router.push("/");
      } else {
        alert("Error al guardar perfil.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-3xl font-bold text-green-800 mb-4">¡Bienvenido a Red Agrícola!</h1>
        <p className="text-xl text-gray-600 mb-10">Elige tu perfil para continuar:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* TRABAJADOR */}
          <button onClick={() => handleSelectRole("WORKER")} disabled={loading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition text-left h-full">
            <div className="text-4xl mb-4">👨‍🌾</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Busco Trabajo</h3>
            <p className="text-gray-500 text-sm">Soy trabajador (temporero, maquinista, almacén) y busco empleo.</p>
          </button>

          {/* MANIJERO (NUEVO) */}
          <button onClick={() => handleSelectRole("FOREMAN")} disabled={loading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-orange-500 transition text-left h-full">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Soy Manijero</h3>
            <p className="text-gray-500 text-sm">Tengo cuadrilla propia y ofrezco servicios de recolección, poda, etc.</p>
          </button>

          {/* EMPRESA */}
          <button onClick={() => handleSelectRole("COMPANY")} disabled={loading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition text-left h-full">
            <div className="text-4xl mb-4">🚜</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Soy Empresa</h3>
            <p className="text-gray-500 text-sm">Busco personal o cuadrillas para mi finca o cooperativa.</p>
          </button>

        </div>
      </div>
    </div>
  );
}