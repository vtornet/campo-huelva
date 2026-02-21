"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { PROVINCIAS, MUNICIPIOS_POR_PROVINCIA, CULTIVOS } from "@/lib/constants";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import AIBioGenerator from "@/components/AIBioGenerator";

const ESPECIALIDADES_INGENIERO = [
  "Gestión de riego", "Fitopatología", "Nutrición vegetal",
  "Sistemas de drenaje", "Producción integrada", "Agricultura ecológica",
  "Control de plagas", "Suelos y fertilización", "Variedades y portainjertos",
  "Postcosecha", "Certificaciones (GlobalGAP, etc.)", "Gestión de explotaciones"
];

const SERVICIOS_INGENIERO = [
  "Asesoramiento técnico", "Peritajes y tasaciones", "Auditorías",
  "Formación y capacitación", "Redacción de proyectos", "Gestión de subvenciones",
  "Análisis de suelo y agua", "Diseño de instalaciones", "Planes de fertilización",
  "Control de calidad", "Consultoría de inversión", "Gestión documental"
];

export default function EngineerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameLastModified, setNameLastModified] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dataConfirmed, setDataConfirmed] = useState(false);

  // Proteger la página: si no hay usuario, ir a login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Cargar perfil existente
  useEffect(() => {
    if (user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.exists && data.role === 'ENGINEER' && data.profile) {
            const profile = data.profile;
            setProfileLoaded(true);

            setFormData({
              fullName: profile.fullName || "",
              phone: profile.phone || "",
              province: profile.province || "",
              city: profile.city || "",
              collegiateNumber: profile.collegiateNumber || "",
              yearsExperience: profile.yearsExperience?.toString() || "",
              bio: profile.bio || "",
              cropExperience: profile.cropExperience || [],
              specialties: profile.specialties || [],
              servicesOffered: profile.servicesOffered || [],
              isAvailable: profile.isAvailable ?? true,
              canTravel: profile.canTravel || false,
              profileImage: profile.profileImage || "",
            });

            // Cargar fecha de última modificación del nombre si existe
            if (profile.nameLastModified) {
              const lastModified = new Date(profile.nameLastModified);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Si no hay usuario, no mostramos nada (redirección en curso)
  if (!user) {
    return null;
  }

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    province: "",
    city: "",
    collegiateNumber: "",
    yearsExperience: "",
    bio: "",
    cropExperience: [] as string[],
    specialties: [] as string[],
    servicesOffered: [] as string[],
    isAvailable: true,
    canTravel: false,
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
    if (formData.collegiateNumber) filled++;
    if (formData.yearsExperience) filled++;
    if (formData.cropExperience.length > 0) filled++;
    if (formData.specialties.length > 0) filled++;
    if (formData.servicesOffered.length > 0) filled++;
    if (formData.bio) filled++;

    return Math.round((filled / total) * 100);
  };

  const completeness = calculateCompleteness();

  const toggleItem = (list: string[], item: string, field: keyof typeof formData) => {
    const currentList = (formData[field] as string[]);
    if (currentList.includes(item)) {
      setFormData({ ...formData, [field]: currentList.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...currentList, item] });
    }
  };

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
      const res = await fetch("/api/profile/engineer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
          email: user.email
        }),
      });
      if (res.ok) {
        showNotification({
          type: "success",
          title: "Perfil guardado",
          message: "Tu perfil de ingeniero ha sido actualizado.",
        });
        router.push("/");
      } else {
        showNotification({
          type: "error",
          title: "Error al guardar",
          message: "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Perfil de Ingeniero Técnico Agrícola</h1>
          <p className="text-slate-500">Muestra tus credenciales y servicios profesionales.</p>
        </div>

        {/* Barra de progreso */}
        {profileLoaded && (
          <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-800">Perfil completado</span>
              <span className="text-sm font-bold text-purple-600">{completeness}%</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness}%`}}
              ></div>
            </div>
            {completeness < 100 && (
              <p className="text-xs text-purple-600 mt-2">
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
              Datos personales
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
                  placeholder="Tu nombre completo"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  disabled={!canEditName}
                  {...(!canEditName && { title: `Solo puedes cambiar tu nombre una vez cada 60 días${daysRemaining !== null ? ` (${daysRemaining} días restantes)` : ""}` })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono *</label>
                <input type="tel" required placeholder="600 123 456" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Provincia *</label>
              <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}>
                <option value="">Selecciona...</option>
                {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Localidad *</label>
              <select
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
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

          {/* Credenciales Profesionales */}
          <div className="bg-purple-50/80 p-5 rounded-2xl border border-purple-100">
            <h3 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
              </svg>
              Credenciales profesionales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Nº de colegiado (opcional)</label>
                <input type="text" placeholder="Ej: 12345" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.collegiateNumber} onChange={e => setFormData({...formData, collegiateNumber: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Años de experiencia</label>
                <input type="number" placeholder="Ej: 10" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.yearsExperience} onChange={e => setFormData({...formData, yearsExperience: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Experiencia en Cultivos */}
          <div>
            <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 104 0 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Experiencia en cultivos
            </label>
            <div className="flex flex-wrap gap-2">
              {CULTIVOS.map(cultivo => (
                <button type="button" key={cultivo} onClick={() => toggleItem(formData.cropExperience, cultivo, "cropExperience")}
                  className={`px-4 py-2 rounded-xl text-sm border font-medium transition-all duration-200 ${
                    formData.cropExperience.includes(cultivo)
                      ? "bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}>
                  {cultivo}
                </button>
              ))}
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.3M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Especialidades técnicas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ESPECIALIDADES_INGENIERO.map(esp => (
                <label key={esp} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    formData.specialties.includes(esp)
                      ? "bg-purple-50 border-purple-400"
                      : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input type="checkbox" className="mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" checked={formData.specialties.includes(esp)} onChange={() => toggleItem(formData.specialties, esp, "specialties")} />
                  <span className="text-sm font-medium">{esp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Servicios Ofrecidos */}
          <div>
            <label className="block font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Servicios que ofreces
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SERVICIOS_INGENIERO.map(serv => (
                <label key={serv} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    formData.servicesOffered.includes(serv)
                      ? "bg-purple-50 border-purple-400"
                      : "border-slate-200 hover:bg-slate-50"
                }`}>
                  <input type="checkbox" className="mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500" checked={formData.servicesOffered.includes(serv)} onChange={() => toggleItem(formData.servicesOffered, serv, "servicesOffered")} />
                  <span className="text-sm font-medium">{serv}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200 shadow-sm">
              <input type="checkbox" className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} />
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 font-medium text-sm">Disponible para nuevos proyectos</span>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200 shadow-sm">
              <input type="checkbox" className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 focus:ring-offset-0" checked={formData.canTravel} onChange={e => setFormData({...formData, canTravel: e.target.checked})} />
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4 4" />
                </svg>
                <span className="text-slate-700 font-medium text-sm">Puedo desplazarme a otras provincias</span>
              </div>
            </label>
          </div>

          {/* BIO CON IA */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
            <AIBioGenerator
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              rol="ENGINEER"
              profileData={{
                fullName: formData.fullName,
                collegiateNumber: formData.collegiateNumber,
                yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
                cropExperience: formData.cropExperience,
                specialties: formData.specialties,
                servicesOffered: formData.servicesOffered,
              }}
              placeholder="Describe tu formación, experiencia y servicios profesionales..."
              label="Sobre ti / Descripción profesional"
            />
          </div>

          {/* Confirmación de datos */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <input
              type="checkbox"
              id="dataConfirmation"
              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 focus:ring-offset-0 mt-0.5"
              checked={dataConfirmed}
              onChange={(e) => setDataConfirmed(e.target.checked)}
              required
            />
            <label htmlFor="dataConfirmation" className="text-sm text-amber-800 cursor-pointer">
              <strong>Confirmo que los datos aportados son reales</strong>. Esta información será visible públicamente y declaro bajo mi responsabilidad la veracidad de los mismos.
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-4 rounded-2xl hover:from-purple-700 hover:to-purple-600 transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none text-lg flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
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
