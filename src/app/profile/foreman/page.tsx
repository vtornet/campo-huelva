"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PROVINCIAS = ["Huelva", "Sevilla", "Cádiz", "Córdoba", "Málaga", "Jaén", "Granada", "Almería", "Badajoz", "Murcia", "Valencia", "Albacete"]; // (Resumido para el ejemplo)
const ESPECIALIDADES = [
    "Fresa - Recolección", "Fresa - Plantación",
    "Cítricos - Recolección", "Cítricos - Poda",
    "Aceituna - Vareo/Recolección", "Aceituna - Poda",
    "Fruta de Hueso - Aclareo", "Fruta de Hueso - Recolección",
    "Viña - Vendimia", "Viña - Poda",
    "Invernadero - Montaje", "Invernadero - Mantenimiento"
];

export default function ForemanProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "", phone: "", province: "", city: "",
    crewSize: "", yearsExperience: "", bio: "",
    hasVan: false, needsBus: false, ownTools: false,
    workArea: [] as string[],
    specialties: [] as string[]
  });

  const toggleItem = (list: string[], item: string, field: "workArea" | "specialties") => {
    if (list.includes(item)) {
      setFormData({ ...formData, [field]: list.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...list, item] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch("/api/profile/foreman", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, uid: user.uid }),
      });
      if (res.ok) router.push("/");
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-orange-800 mb-2">Perfil de Manijero / Jefe de Cuadrilla</h1>
        <p className="text-gray-500 mb-8">Ofrece los servicios de tu cuadrilla a las empresas.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required placeholder="Nombre del Manijero *" className="p-3 border rounded-lg w-full"
              value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            <input type="tel" required placeholder="Teléfono *" className="p-3 border rounded-lg w-full"
              value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <select required className="p-3 border rounded-lg w-full bg-white" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}>
                <option value="">Provincia Base...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <input type="text" placeholder="Localidad" className="p-3 border rounded-lg w-full"
              value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
          </div>

          {/* Datos Cuadrilla */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h3 className="font-bold text-orange-800 mb-3">Datos de la Cuadrilla</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm text-gray-600">Nº Personas aprox.</label>
                    <input type="number" required className="p-3 border rounded-lg w-full"
                    value={formData.crewSize} onChange={e => setFormData({...formData, crewSize: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm text-gray-600">Años de experiencia / Campañas</label>
                    <input type="number" required className="p-3 border rounded-lg w-full"
                    value={formData.yearsExperience} onChange={e => setFormData({...formData, yearsExperience: e.target.value})} />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={formData.hasVan} onChange={e => setFormData({...formData, hasVan: e.target.checked})} /> 🚐 Tenemos furgonetas propias</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={formData.needsBus} onChange={e => setFormData({...formData, needsBus: e.target.checked})} /> 🚌 Necesitamos autobús</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5" checked={formData.ownTools} onChange={e => setFormData({...formData, ownTools: e.target.checked})} /> ✂️ Herramientas propias</label>
            </div>
          </div>

          {/* Área de Movilidad */}
          <div>
            <label className="block font-semibold mb-2">Área de trabajo (¿Hasta dónde os desplazáis?)</label>
            <div className="flex flex-wrap gap-2">
                {PROVINCIAS.map(p => (
                    <button type="button" key={p} onClick={() => toggleItem(formData.workArea, p, "workArea")}
                    className={`px-3 py-1 rounded-full text-sm border ${formData.workArea.includes(p) ? "bg-orange-600 text-white border-orange-600" : "bg-white text-gray-600 border-gray-300"}`}>
                        {p}
                    </button>
                ))}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block font-semibold mb-2">Especialidades y Tareas</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ESPECIALIDADES.map(esp => (
                    <label key={esp} className={`flex items-center p-2 border rounded cursor-pointer ${formData.specialties.includes(esp) ? "bg-orange-50 border-orange-500" : "hover:bg-gray-50"}`}>
                        <input type="checkbox" className="mr-2" checked={formData.specialties.includes(esp)} onChange={() => toggleItem(formData.specialties, esp, "specialties")} />
                        {esp}
                    </label>
                ))}
            </div>
          </div>

          <textarea placeholder="Más detalles: 'Somos una cuadrilla seria de Coria del Río, expertos en cítricos...'" rows={3} className="w-full p-3 border rounded-lg"
            value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />

          <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700">
            {loading ? "Guardando..." : "Guardar Ficha de Cuadrilla"}
          </button>
        </form>
      </div>
    </div>
  );
}