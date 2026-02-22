"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { CULTIVOS, PROVINCIAS, MUNICIPIOS_POR_PROVINCIA } from "@/lib/constants";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import AIBioGenerator from "@/components/AIBioGenerator";

export default function WorkerProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameLastModified, setNameLastModified] = useState<string | null>(null);
  const [dataConfirmed, setDataConfirmed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Proteger la página: si no hay usuario, ir a login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, router]);

  // Cargar perfil existente
  useEffect(() => {
    if (user) {
      fetch(`/api/profile/worker?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setProfileLoaded(true);
            setFormData({
              fullName: data.fullName || "",
              phone: data.phone || "",
              province: data.province || "",
              city: data.city || "",
              bio: data.bio || "",
              hasVehicle: data.hasVehicle || false,
              canRelocate: data.canRelocate || false,
              foodHandler: data.foodHandler || false,
              phytosanitaryLevel: data.phytosanitaryLevel || "",
              experience: data.experience || [],
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
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
    bio: "",
    hasVehicle: false,
    canRelocate: false,
    foodHandler: false,
    phytosanitaryLevel: "",
    experience: [] as string[],
    profileImage: "",
  });

  // Calcular porcentaje de completitud del perfil
  const calculateCompleteness = () => {
    let filled = 0;
    let total = 9; // Campos principales a considerar

    if (formData.fullName) filled++;
    if (formData.phone) filled++;
    if (formData.province) filled++;
    if (formData.city) filled++;
    if (formData.hasVehicle !== undefined) filled++;
    if (formData.phytosanitaryLevel) filled++;
    if (formData.foodHandler !== undefined) filled++;
    if (formData.experience.length > 0) filled++;
    if (formData.bio) filled++;

    return Math.round((filled / total) * 100);
  };

  const completeness = calculateCompleteness();

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
    if (!user) {
      showNotification({
        type: "error",
        title: "Sesión no iniciada",
        message: "Por favor, inicia sesión para continuar.",
      });
      router.push(`/${locale}/login`);
      return;
    }

    // Verificar casilla de confirmación
    if (!dataConfirmed) {
      setShowConfirmation(true);
      return;
    }

    // Validar que el uid existe
    if (!user.uid) {
      console.error("Error: user.uid es undefined o null", user);
      showNotification({
        type: "error",
        title: "Error de autenticación",
        message: "Cierra sesión y vuelve a entrar.",
      });
      return;
    }

    setLoading(true);

    // Preparar datos a enviar
    const dataToSend = {
      ...formData,
      uid: user.uid,
      email: user.email || null,
      phytosanitaryLevel: formData.phytosanitaryLevel || null
    };

    console.log("Enviando datos:", dataToSend);

    try {
      const res = await fetch("/api/profile/worker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await res.json();

      if (res.ok) {
        showNotification({
          type: "success",
          title: "Perfil guardado",
          message: "Tu perfil profesional ha sido actualizado correctamente.",
        });
        router.push(`/${locale}`);
      } else {
        console.error("Error del servidor:", responseData);
        showNotification({
          type: "error",
          title: "Error al guardar",
          message: responseData.error || "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error("Error de red:", error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Perfil profesional</h1>
          <p className="text-slate-500">
            Cuantos más datos rellenes, más fácil será que las empresas te encuentren.
          </p>
        </div>

        {/* Barra de progreso */}
        {profileLoaded && (
          <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-emerald-800">Perfil completado</span>
              <span className="text-sm font-bold text-emerald-600">{completeness}%</span>
            </div>
            <div className="w-full bg-emerald-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness}%`}}
              ></div>
            </div>
            {completeness < 100 && (
              <p className="text-xs text-emerald-600 mt-2">
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

          {/* DATOS PERSONALES */}
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
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!canEditName}
                  {...(!canEditName && { title: `Solo puedes cambiar tu nombre una vez cada 60 días (${daysRemaining} días restantes)` })}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono *</label>
                <input
                  type="tel"
                  required
                  placeholder="600 123 456"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* UBICACIÓN Y MOVILIDAD */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ubicación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Provincia *</label>
                <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })}>
                  <option value="">Selecciona...</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Localidad *</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!formData.province}
                >
                  <option value="">{formData.province ? "Selecciona..." : "Primero selecciona provincia"}</option>
                  {formData.province && MUNICIPIOS_POR_PROVINCIA[formData.province]?.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 shadow-sm">
                <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0"
                  checked={formData.hasVehicle} onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.checked })} />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="text-slate-700 font-medium">Tengo vehículo propio</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all duration-200 shadow-sm">
                <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0"
                  checked={formData.canRelocate} onChange={(e) => setFormData({ ...formData, canRelocate: e.target.checked })} />
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <span className="text-slate-700 font-medium">Disponible para viajar</span>
                </div>
              </label>
            </div>
          </div>

          {/* --- CARNETS Y CERTIFICACIONES --- */}
          <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Carnets y certificaciones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Carnet Fitosanitarios */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Carnet fitosanitario</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.phytosanitaryLevel}
                  onChange={(e) => setFormData({ ...formData, phytosanitaryLevel: e.target.value })}
                >
                  <option value="">No dispongo</option>
                  <option value="BASIC">Nivel básico</option>
                  <option value="QUALIFIED">Nivel cualificado</option>
                </select>
              </div>

              {/* Manipulador Alimentos */}
              <div className="flex items-center h-full pt-6">
                <label className="flex items-center gap-3 cursor-pointer w-full p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 shadow-sm">
                  <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 focus:ring-offset-0"
                    checked={formData.foodHandler}
                    onChange={(e) => setFormData({ ...formData, foodHandler: e.target.checked })}
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-slate-800 font-medium">Carnet manipulador de alimentos</span>
                  </div>
                </label>
              </div>

            </div>
          </div>
          {/* ----------------------------------------------- */}

          {/* BIO / DESCRIPCIÓN CON IA */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
            <AIBioGenerator
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              rol="USER"
              profileData={{
                fullName: formData.fullName,
                experience: formData.experience,
                hasVehicle: formData.hasVehicle,
                canRelocate: formData.canRelocate,
                phytosanitaryLevel: formData.phytosanitaryLevel,
                foodHandler: formData.foodHandler,
              }}
              placeholder="Describe tu experiencia y habilidades profesionales..."
              label="Sobre ti (descripción profesional)"
            />
          </div>

          {/* EXPERIENCIA */}
          <div>
            <label className="block text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              Experiencia en cultivos
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {CULTIVOS.map(crop => (
                <label key={crop} className={`flex items-center p-3 rounded-xl border cursor-pointer text-sm transition-all duration-200 font-medium ${
                  formData.experience.includes(crop)
                    ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}>
                  <input type="checkbox" className="hidden" checked={formData.experience.includes(crop)} onChange={() => toggleCrop(crop)} />
                  <span className="mr-2">{formData.experience.includes(crop) ? '✓' : ''}</span>
                  {crop}
                </label>
              ))}
            </div>
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

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-4 rounded-2xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none text-lg flex items-center justify-center gap-2">
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
