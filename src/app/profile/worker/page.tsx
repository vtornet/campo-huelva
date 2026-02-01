"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PUEBLOS_HUELVA, CULTIVOS, PROVINCIAS } from "@/lib/constants";

export default function WorkerProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    bio: "",
    hasVehicle: false,
    canRelocate: false,
    foodHandler: false,         // <--- NUEVO
    phytosanitaryLevel: "",     // <--- NUEVO ("BASIC", "QUALIFIED" o "")
    experience: [] as string[],
  });

  const toggleCrop = (crop: string) => {
    setFormData(prev => {
      const exists = prev.experience.includes(crop);
      if (exists) {
        return { ...prev, experience: prev.experience.filter(c => c !== crop) };
      } else {
        return { ...prev, experience: [...prev.experience, crop] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch("/api/profile/worker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
          email: user.email,
          // Si el select de fito está vacío, enviamos null
          phytosanitaryLevel: formData.phytosanitaryLevel || null 
        }),
      });

      if (res.ok) {
        router.push("/");
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
    <div className="min-h-screen bg-gray-50 flex justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-green-800 mb-2">Completar Perfil Profesional</h1>
        <p className="text-gray-500 mb-8">
          Cuantos más datos rellenes, más fácil será que las empresas te encuentren.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* DATOS PERSONALES */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">👤 Datos Personales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input type="tel" required placeholder="600 123 456" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          </div>

          {/* UBICACIÓN Y MOVILIDAD */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">📍 Ubicación</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
                <select required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                <input type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-green-500 transition shadow-sm">
                <input type="checkbox" className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  checked={formData.hasVehicle} onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.checked })} />
                <span className="text-gray-700 font-medium">🚗 Tengo vehículo propio</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-green-500 transition shadow-sm">
                <input type="checkbox" className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  checked={formData.canRelocate} onChange={(e) => setFormData({ ...formData, canRelocate: e.target.checked })} />
                <span className="text-gray-700 font-medium">🌍 Disponible para viajar</span>
              </label>
            </div>
          </div>

          {/* --- NUEVA SECCIÓN: CARNETS Y CERTIFICACIONES --- */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4">📜 Carnets y Certificaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Carnet Fitosanitarios */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carnet Fitosanitarios</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                  value={formData.phytosanitaryLevel} 
                  onChange={(e) => setFormData({ ...formData, phytosanitaryLevel: e.target.value })}
                >
                  <option value="">❌ No dispongo</option>
                  <option value="BASIC">🟢 Nivel Básico</option>
                  <option value="QUALIFIED">🌟 Nivel Cualificado</option>
                </select>
              </div>

              {/* Manipulador Alimentos */}
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition">
                  <input type="checkbox" className="w-6 h-6 text-green-600 rounded focus:ring-green-500"
                    checked={formData.foodHandler} 
                    onChange={(e) => setFormData({ ...formData, foodHandler: e.target.checked })} 
                  />
                  <span className="text-gray-800 font-medium">🍎 Carnet Manipulador de Alimentos</span>
                </label>
              </div>

            </div>
          </div>
          {/* ----------------------------------------------- */}

          {/* EXPERIENCIA */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">🌾 Experiencia en cultivos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {CULTIVOS.map(crop => (
                <label key={crop} className={`flex items-center p-2 rounded-lg border cursor-pointer text-sm transition-all ${formData.experience.includes(crop) ? 'bg-green-100 border-green-500 text-green-800 font-bold' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}>
                  <input type="checkbox" className="hidden" checked={formData.experience.includes(crop)} onChange={() => toggleCrop(crop)} />
                  <span className="mr-2">{formData.experience.includes(crop) ? '✅' : '⬜'}</span>
                  {crop}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-700 text-white font-bold py-4 rounded-xl hover:bg-green-800 transition shadow-lg disabled:bg-gray-400 text-lg">
            {loading ? "Guardando..." : "💾 Guardar Perfil y Ver Ofertas"}
          </button>
        </form>
      </div>
    </div>
  );
}