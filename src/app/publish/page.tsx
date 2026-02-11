"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PROVINCIAS, MUNICIPIOS_POR_PROVINCIA } from "@/lib/constants";


// Componente interno que lee los parámetros
function PublishForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type"); // "OFFER" o "DEMAND"

  // Si es DEMAND (Trabajador pidiendo trabajo), el modo es DEMAND.
  // Si no, es SHARED (Oferta compartida) u OFFICIAL (si es empresa, lo gestiona la API).
  const isDemand = typeParam === "DEMAND";

  // Proteger la página: si no hay usuario, ir a login
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

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
          type: isDemand ? "DEMAND" : "SHARED" // Enviamos el tipo correcto (coincide con lo que espera la API)
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
    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
      <div className="mb-6">
        <div className={`w-14 h-14 rounded-2xl ${isDemand ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center mb-4`}>
          <svg className={`w-7 h-7 ${isDemand ? 'text-orange-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isDemand ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
          </svg>
        </div>
        <h1 className={`text-2xl font-bold mb-2 tracking-tight ${isDemand ? "text-orange-800" : "text-emerald-800"}`}>
          {isDemand ? "Publicar demanda de empleo" : "Compartir oferta de empleo"}
        </h1>

        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {isDemand
            ? "Describe qué buscas, tu experiencia y disponibilidad. Las empresas te contactarán."
            : "Comparte una oferta que hayas visto (cartel, internet, boca a boca) para ayudar a otros."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isDemand ? "Título breve (Ej: Cuadrilla experta en poda)" : "Título del puesto (Ej: Recolectores fresa)"}
          </label>
          <input type="text" required
            placeholder={isDemand ? "Busco trabajo de..." : "Se busca..."}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
            value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        {/* Reutilizamos los selectores de Provincia/Pueblo que ya tenías... */}
        {/* ... (Mantén aquí tu código de inputs de Ubicación y Descripción igual que antes) ... */}

        {/* Aquí te facilito los inputs por si acaso prefieres copiar el bloque completo: */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provincia *</label>
              <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })}>
                <option value="">Selecciona...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{isDemand ? "Tu localidad" : "Lugar del trabajo"}</label>
              <select
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!formData.province}
              >
                <option value="">{formData.province ? "Selecciona..." : "Primero selecciona provincia"}</option>
                {formData.province && MUNICIPIOS_POR_PROVINCIA[formData.province]?.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descripción detallada</label>
            <textarea required rows={5}
              placeholder={isDemand ? "Explica tu experiencia, si tienes vehículo, disponibilidad..." : "Detalles de la oferta..."}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div className="flex gap-4 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3.5 px-4 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all duration-200 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className={`flex-1 py-3.5 px-4 text-white rounded-xl font-semibold shadow-md disabled:from-slate-300 disabled:to-slate-300 transition-all duration-200 flex items-center justify-center gap-2 ${
              isDemand
                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-orange-500/20"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/20"
            }`}>
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Publicando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isDemand ? "Publicar demanda" : "Compartir oferta"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente Principal (Wrapper)
export default function PublishPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      }>
        <PublishForm />
      </Suspense>
    </div>
  );
}
