"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PROVINCIAS, MUNICIPIOS_POR_PROVINCIA } from "@/lib/constants";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import AIBioGenerator from "@/components/AIBioGenerator";

const ESPECIALIDADES = [
    "Fresa - Recolección", "Fresa - Plantación",
    "Cítricos - Recolección", "Cítricos - Poda",
    "Aceituna - Vareo/Recolección", "Aceituna - Poda",
    "Fruta de Hueso - Aclareo", "Fruta de Hueso - Recolección",
    "Viña - Vendimia", "Viña - Poda",
    "Invernadero - Montaje", "Invernadero - Mantenimiento"
];

export default function ForemanProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameLastModified, setNameLastModified] = useState<string | null>(null);
  const [dataConfirmed, setDataConfirmed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Proteger la página: si no hay usuario, ir a login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Cargar perfil existente
  useEffect(() => {
    if (user) {
      fetch(`/api/profile/foreman?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setProfileLoaded(true);
            setFormData({
              fullName: data.fullName || "",
              phone: data.phone || "",
              province: data.province || "",
              city: data.city || "",
              crewSize: data.crewSize?.toString() || "",
              yearsExperience: data.yearsExperience?.toString() || "",
              bio: data.bio || "",
              hasVan: data.hasVan || false,
              needsBus: data.needsBus || false,
              ownTools: data.ownTools || false,
              workArea: data.workArea || [],
              specialties: data.specialties || [],
              profileImage: data.profileImage || "",
            });

            // Cargar fecha de última modificación del nombre si existe
            if (data.nameLastModified) {
              const lastModified = new Date(data.nameLastModified);
              const daysSince = Math.floor((Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24));
              setNameLastModified(daysSince.toString());
            }
          }
        })
        .catch(err => console.error("Error cargando perfil:", err));
    }
  }, [user]);

  // Mostrar loading mientras verificamos autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Si no hay usuario, no mostramos nada (redirección en curso)
  if (!user) {
    return null;
  }

  const [formData, setFormData] = useState({
    fullName: "", phone: "", province: "", city: "",
    crewSize: "", yearsExperience: "", bio: "",
    hasVan: false, needsBus: false, ownTools: false,
    workArea: [] as string[],
    specialties: [] as string[],
    profileImage: ""
  });

  // Calcular porcentaje de completitud del perfil
  const calculateCompleteness = () => {
    let filled = 0;
    let total = 10; // Campos principales a considerar

    if (formData.fullName) filled++;
    if (formData.phone) filled++;
    if (formData.province) filled++;
    if (formData.city) filled++;
    if (formData.crewSize) filled++;
    if (formData.yearsExperience) filled++;
    if (formData.workArea.length > 0) filled++;
    if (formData.specialties.length > 0) filled++;
    if (formData.hasVan !== undefined || formData.ownTools !== undefined) filled++;
    if (formData.bio) filled++;

    return Math.round((filled / total) * 100);
  };

  const completeness = calculateCompleteness();

  const toggleItem = (list: string[], item: string, field: "workArea" | "specialties") => {
    if (list.includes(item)) {
      setFormData({ ...formData, [field]: list.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...list, item] });
    }
  };

  // Calcular días restantes para cambiar nombre
  const getDaysRemaining = () => {
    if (!nameLastModified) return null;
    const days = parseInt(nameLastModified);
    return Math.max(0, 60 - days);
  };

  const daysRemaining = getDaysRemaining();
  const canEditName = daysRemaining === null || daysRemaining === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Verificar casilla de confirmación
    if (!dataConfirmed) {
      setShowConfirmation(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/foreman", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
          email: user.email
        }),
      });
      if (res.ok) router.push("/");
      else alert("Error al guardar perfil");
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Perfil de manijero</h1>
          <p className="text-slate-500">Ofrece los servicios de tu cuadrilla a las empresas.</p>
        </div>

        {/* Barra de progreso */}
        {profileLoaded && (
          <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-orange-800">Perfil completado</span>
              <span className="text-sm font-bold text-orange-600">{completeness}%</span>
            </div>
            <div className="w-full bg-orange-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness}%`}}
              ></div>
            </div>
            {completeness < 100 && (
              <p className="text-xs text-orange-600 mt-2">
                💡 Completa más datos para aumentar tu visibilidad
              </p>
            )}
          </div>
        )}

        {/* Foto de perfil */}
        <div className="flex justify-center mb-8">
          <ProfileImageUpload
            currentImage={formData.profileImage}
            onImageUploaded={(url) => setFormData({ ...formData, profileImage: url })}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos Básicos */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del manijero
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre completo *
                  {!canEditName && daysRemaining !== null && (
                    <span className="ml-2 text-xs text-orange-600 font-normal">
                      ({daysRemaining} días restantes)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  disabled={!canEditName}
                  {...(!canEditName && { title: `Solo puedes cambiar tu nombre una vez cada 60 días (${daysRemaining} días restantes)` })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono *</label>
                <input
                  type="tel"
                  required
                  placeholder="600 123 456"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Provincia base *</label>
               <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                 value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}>
                  <option value="">Selecciona...</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Localidad *</label>
               <select
                 required
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                 value={formData.city}
                 onChange={e => setFormData({...formData, city: e.target.value})}
                 disabled={!formData.province}
               >
                 <option value="">{formData.province ? "Selecciona..." : "Primero selecciona provincia"}</option>
                 {formData.province && MUNICIPIOS_POR_PROVINCIA[formData.province]?.map(m => (
                   <option key={m} value={m}>{m}</option>
                 ))}
               </select>
             </div>
          </div>

          {/* Datos Cuadrilla */}
          <div className="bg-orange-50/80 p-5 rounded-2xl border border-orange-100">
            <h3 className="font-semibold text-orange-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Datos de la cuadrilla
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Nº de personas aprox.</label>
                    <input type="number" required placeholder="Ej: 5" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                    value={formData.crewSize} onChange={e => setFormData({...formData, crewSize: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Años de experiencia / campañas</label>
                    <input type="number" required placeholder="Ej: 10" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all duration-200"
                    value={formData.yearsExperience} onChange={e => setFormData({...formData, yearsExperience: e.target.value})} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200 shadow-sm">
                  <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 focus:ring-offset-0" checked={formData.hasVan} onChange={e => setFormData({...formData, hasVan: e.target.checked})} />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-slate-700 font-medium text-sm">Furgonetas propias</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200 shadow-sm">
                  <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 focus:ring-offset-0" checked={formData.needsBus} onChange={e => setFormData({...formData, needsBus: e.target.checked})} />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-slate-700 font-medium text-sm">Necesitamos bus</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all duration-200 shadow-sm">
                  <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 focus:ring-offset-0" checked={formData.ownTools} onChange={e => setFormData({...formData, ownTools: e.target.checked})} />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-slate-700 font-medium text-sm">Herramientas propias</span>
                  </div>
                </label>
            </div>
          </div>

          {/* Área de Movilidad */}
          <div>
            <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Área de trabajo (¿hasta dónde os desplazáis?)
            </label>
            <div className="flex flex-wrap gap-2">
                {PROVINCIAS.map(p => (
                    <button type="button" key={p} onClick={() => toggleItem(formData.workArea, p, "workArea")}
                    className={`px-4 py-2 rounded-xl text-sm border font-medium transition-all duration-200 ${
                      formData.workArea.includes(p)
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}>
                        {p}
                    </button>
                ))}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Especialidades y tareas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ESPECIALIDADES.map(esp => (
                    <label key={esp} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      formData.specialties.includes(esp)
                        ? "bg-orange-50 border-orange-400"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}>
                        <input type="checkbox" className="mr-3 w-4 h-4 text-orange-600 rounded focus:ring-orange-500" checked={formData.specialties.includes(esp)} onChange={() => toggleItem(formData.specialties, esp, "specialties")} />
                        <span className="text-sm font-medium">{esp}</span>
                    </label>
                ))}
            </div>
          </div>

          {/* BIO CON IA */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
            <AIBioGenerator
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              rol="FOREMAN"
              profileData={{
                fullName: formData.fullName,
                crewSize: formData.crewSize ? parseInt(formData.crewSize) : undefined,
                yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
                hasVan: formData.hasVan,
                ownTools: formData.ownTools,
                specialties: formData.specialties,
                workArea: formData.workArea,
              }}
              placeholder="Describe tu cuadrilla, experiencia y recursos disponibles..."
              label="Sobre tu cuadrilla (descripción profesional)"
            />
          </div>

          {/* Confirmación de datos */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <input
              type="checkbox"
              id="dataConfirmation"
              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 focus:ring-offset-0 mt-0.5"
              checked={dataConfirmed}
              onChange={(e) => {
                setDataConfirmed(e.target.checked);
                setShowConfirmation(false);
              }}
              required
            />
            <label htmlFor="dataConfirmation" className="text-sm text-amber-800 cursor-pointer">
              <strong>Confirmo que los datos aportados son reales</strong>. Esta información será visible públicamente y declaro bajo mi responsabilidad la veracidad de los mismos.
            </label>
          </div>
          {showConfirmation && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">Debes confirmar que los datos son reales antes de guardar.</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white font-semibold py-4 rounded-2xl hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-orange-500/25 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none text-lg flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar perfil
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
