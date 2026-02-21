"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PROVINCIAS, MUNICIPIOS_POR_PROVINCIA, TIPOS_TAREA, TIPOS_CONTRATO, PERIODOS_SALARIALES, TIPOS_JORNADA } from "@/lib/constants";
import AIImprovedTextarea from "@/components/AIImprovedTextarea";


// Componente interno que lee los parámetros
function PublishForm() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type"); // "OFFER" o "DEMAND"
  const editId = searchParams.get("edit"); // ID de la publicación a editar
  const isEditMode = !!editId;

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
  const [loadingPost, setLoadingPost] = useState(false);
  const [postType, setPostType] = useState<'DEMAND' | 'OFFER' | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Si es DEMAND (Trabajador pidiendo trabajo), el modo es DEMAND.
  // Si no, es SHARED (Oferta compartida) u OFFICIAL (si es empresa, lo gestiona la API).
  // En modo edición, el tipo se determina a partir de la publicación existente.
  const isDemand = postType === "DEMAND";
  const isOffer = !isDemand;
  const [formData, setFormData] = useState({
    title: "",
    province: "",
    location: "",
    description: "",
    taskType: "", // Tipo de tarea para demandas
    // Campos para ofertas de empleo
    contractType: "",
    providesAccommodation: false,
    salaryAmount: "",
    salaryPeriod: "",
    hoursPerWeek: "",
    startDate: "",
    endDate: "",
  });

  // Cargar rol del usuario
  useEffect(() => {
    if (user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.role) {
            setUserRole(data.role);
          }
        })
        .catch(err => console.error("Error fetching user role:", err));
    }
  }, [user]);

  // Cargar datos de la publicación si estamos en modo edición
  useEffect(() => {
    if (editId && user) {
      setLoadingPost(true);
      fetch(`/api/posts/${editId}`)
        .then(res => res.json())
        .then(data => {
          // Verificar que la publicación pertenece al usuario
          if (data.publisherId !== user.uid && data.companyId !== user.uid) {
            alert("No tienes permiso para editar esta publicación");
            router.push("/my-posts");
            return;
          }

          // Determinar el tipo de la publicación
          const type = data.type || (typeParam === "DEMAND" ? "DEMAND" : "SHARED");
          setPostType(type === "DEMAND" ? "DEMAND" : "OFFER");

          // Cargar los datos en el formulario
          setFormData({
            title: data.title || "",
            province: data.province || "",
            location: data.location || "",
            description: data.description || "",
            taskType: data.taskType || "",
            contractType: data.contractType || "",
            providesAccommodation: data.providesAccommodation || false,
            salaryAmount: data.salaryAmount || "",
            salaryPeriod: data.salaryPeriod || "",
            hoursPerWeek: data.hoursPerWeek || "",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
          });
        })
        .catch(err => {
          console.error("Error loading post:", err);
          alert("Error al cargar la publicación");
          router.push("/my-posts");
        })
        .finally(() => setLoadingPost(false));
    } else if (!editId && userRole !== null) {
      // Si no estamos editando, usar el typeParam o determinar por rol
      const type = typeParam || (userRole === 'COMPANY' ? 'OFFER' : 'DEMAND');
      setPostType(type === "DEMAND" ? "DEMAND" : "OFFER");
    }
  }, [editId, user, typeParam, userRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let res;

      if (isEditMode && editId) {
        // Modo edición: usar PUT
        res = await fetch(`/api/posts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            providesAccommodation: formData.providesAccommodation,
            userId: user.uid,
          }),
        });
      } else {
        // Modo creación: usar POST
        res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            providesAccommodation: formData.providesAccommodation,
            uid: user.uid,
            type: isDemand ? "DEMAND" : "SHARED" // Enviamos el tipo correcto (coincide con lo que espera la API)
          }),
        });
      }

      if (res.ok) {
        router.push("/my-posts");
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar la publicación.");
      }
    } catch (error) {
      console.error(error);
      alert("Error al guardar la publicación.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Si estamos editando pero aún no conocemos el tipo, mostrar loading
  if (isEditMode && !postType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
      <div className="mb-6">
        <div className={`w-14 h-14 rounded-2xl ${postType === 'DEMAND' ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center mb-4`}>
          <svg className={`w-7 h-7 ${postType === 'DEMAND' ? 'text-orange-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {postType === 'DEMAND' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            )}
          </svg>
        </div>
        <h1 className={`text-2xl font-bold mb-2 tracking-tight ${postType === 'DEMAND' ? "text-orange-800" : "text-emerald-800"}`}>
          {isEditMode ? "Editar publicación" : (postType === 'DEMAND' ? "Publicar demanda de empleo" : "Publicar oferta de empleo")}
        </h1>

        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
          {postType === 'DEMAND'
            ? "Describe qué buscas, tu experiencia y disponibilidad. Las empresas te contactarán."
            : "Completa todos los detalles de la oferta para atraer a los mejores candidatos."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TÍTULO */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {postType === 'DEMAND' ? "Título breve (Ej: Cuadrilla experta en poda)" : "Título del puesto (Ej: Recolectores fresa)"}
          </label>
          <input type="text" required
            placeholder={postType === 'DEMAND' ? "Busco trabajo de..." : "Se busca..."}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
            value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
        </div>

        {/* Selector de tipo de tarea - solo para demandas */}
        {postType === 'DEMAND' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de tarea *</label>
            <select required
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
              value={formData.taskType} onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}>
              <option value="">Selecciona el tipo de tarea...</option>
              {TIPOS_TAREA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
        )}

        {/* UBICACIÓN */}
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
            <label className="block text-sm font-medium text-slate-700 mb-2">{postType === 'DEMAND' ? "Tu localidad" : "Lugar del trabajo"}</label>
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

        {/* === CAMPOS ESPECÍFICOS PARA OFERTAS DE EMPLEO === */}
        {postType === 'OFFER' && (
          <div className="space-y-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
            <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Condiciones laborales
            </h3>

            {/* Tipo de contrato */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de contrato *</label>
              <select
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
              >
                <option value="">Selecciona el tipo de contrato...</option>
                {TIPOS_CONTRATO.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            {/* Salario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Salario bruto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 9,50€ o 1200€"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.salaryAmount}
                  onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Periodo *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.salaryPeriod}
                  onChange={(e) => setFormData({ ...formData, salaryPeriod: e.target.value })}
                >
                  <option value="">Periodo...</option>
                  {PERIODOS_SALARIALES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Jornada */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Horas semanales *</label>
              <select
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
              >
                <option value="">Selecciona la jornada...</option>
                {TIPOS_JORNADA.map(j => (
                  <option key={j.value} value={j.horas?.toString() || "null"}>
                    {j.label} {j.horas ? `(${j.horas}h/semana)` : ''}
                  </option>
                ))}
                <option value="40">Jornada completa (40h)</option>
                <option value="30">Media jornada (30h)</option>
                <option value="20">Media jornada (20h)</option>
                <option value="15">Part-time (15h)</option>
              </select>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de inicio</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de fin (opcional)</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Alojamiento */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <input
                type="checkbox"
                id="accommodation"
                className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                checked={formData.providesAccommodation}
                onChange={(e) => setFormData({ ...formData, providesAccommodation: e.target.checked })}
              />
              <label htmlFor="accommodation" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                Se ofrece alojamiento a los trabajadores
              </label>
              {formData.providesAccommodation && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                  Incluido
                </span>
              )}
            </div>
          </div>
        )}

        {/* Descripción con botón de mejora por IA */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-100">
          <AIImprovedTextarea
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            titulo={formData.title}
            provincia={formData.province}
            tipo={isDemand ? "DEMAND" : "OFFER"}
            placeholder={isDemand
              ? "Explica tu experiencia, si tienes vehículo, disponibilidad..."
              : "Detalles de la oferta: requisitos, descripción del trabajo, condiciones..."}
            label="Descripción detallada"
            rows={5}
            required
          />
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
              postType === 'DEMAND'
                ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-orange-500/20"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/20"
            }`}>
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? "Guardando..." : "Publicando..."}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isEditMode ? "Guardar cambios" : (postType === 'DEMAND' ? "Publicar demanda" : "Publicar oferta")}
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
