"use client";
import { useState, Suspense } from "react"; // <--- AÑADIR Suspense
import { useRouter, useSearchParams } from "next/navigation"; // <--- AÑADIR useSearchParams
import { useAuth } from "@/context/AuthContext";
// Importamos la lista única de verdad
import { PROVINCIAS } from "@/lib/constants";


// Componente interno que lee los parámetros
function PublishForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type"); // "OFFER" o "DEMAND"

  // Si es DEMAND (Trabajador pidiendo trabajo), el modo es DEMAND.
  // Si no, es SHARED (Oferta compartida) u OFFICIAL (si es empresa, lo gestiona la API).
  const isDemand = typeParam === "DEMAND";
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    province: "",
    location: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
          postType: isDemand ? "DEMAND" : "SHARED" // Enviamos el tipo correcto
        }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        alert("Error al publicar.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 h-fit">
      <h1 className={`text-2xl font-bold mb-6 ${isDemand ? "text-orange-800" : "text-green-800"}`}>
        {isDemand ? "🗣️ Publicar Demanda de Empleo" : "📢 Compartir Oferta de Empleo"}
      </h1>
      
      <p className="mb-6 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
        {isDemand 
          ? "Describe qué buscas, tu experiencia y disponibilidad. Las empresas te contactarán." 
          : "Comparte una oferta que hayas visto (cartel, internet, boca a boca) para ayudar a otros."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isDemand ? "Título breve (Ej: Cuadrilla experta en poda)" : "Título del puesto (Ej: Recolectores fresa)"}
          </label>
          <input type="text" required 
            placeholder={isDemand ? "Busco trabajo de..." : "Se busca..."}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        {/* Reutilizamos los selectores de Provincia/Pueblo que ya tenías... */}
        {/* ... (Mantén aquí tu código de inputs de Ubicación y Descripción igual que antes) ... */}
        
        {/* Aquí te facilito los inputs por si acaso prefieres copiar el bloque completo: */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
              <select required className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })}>
                <option value="">Selecciona...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isDemand ? "Tu localidad" : "Lugar del trabajo"}</label>
              <input type="text" required placeholder="Ej: Lepe"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
            <textarea required rows={5} 
              placeholder={isDemand ? "Explica tu experiencia, si tienes vehículo, disponibilidad..." : "Detalles de la oferta..."}
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={loading} 
            className={`flex-1 py-3 px-4 text-white rounded-lg font-bold shadow-md disabled:bg-gray-400 ${isDemand ? "bg-orange-600 hover:bg-orange-700" : "bg-green-600 hover:bg-green-700"}`}>
            {loading ? "Publicando..." : (isDemand ? "Publicar Demanda" : "Compartir Oferta")}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente Principal (Wrapper)
export default function PublishPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <Suspense fallback={<div>Cargando...</div>}>
        <PublishForm />
      </Suspense>
    </div>
  );
}