"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PROVINCIAS, MUNICIPIOS_POR_PROVINCIA } from "@/lib/constants";

export default function CompanyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isUpdate, setIsUpdate] = useState(false);
  const [dataConfirmed, setDataConfirmed] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [formData, setFormData] = useState({
    companyName: "",
    cif: "",
    address: "",
    city: "",
    province: "",
    phone: "",
    contactPerson: "",
    website: "",
    description: "",
  });

  // Proteger la página: si no hay usuario, ir a login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Cargar perfil existente si lo hay
  useEffect(() => {
    if (user) {
      fetch(`/api/profile/company?uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.companyName) {
            setFormData({
              companyName: data.companyName || "",
              cif: data.cif || "",
              address: data.address || "",
              city: data.city || "",
              province: data.province || "",
              phone: data.phone || "",
              contactPerson: data.contactPerson || "",
              website: data.website || "",
              description: data.description || "",
            });
            setIsUpdate(true);
            setProfileLoaded(true);
          }
        })
        .catch(() => {
          // Error al cargar, empezamos con formulario vacío
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [user]);

  // Calcular porcentaje de completitud del perfil
  const calculateCompleteness = () => {
    let filled = 0;
    let total = 8; // Campos principales a considerar

    if (formData.companyName) filled++;
    if (formData.cif) filled++;
    if (formData.phone) filled++;
    if (formData.province) filled++;
    if (formData.city) filled++;
    if (formData.contactPerson) filled++;
    if (formData.address) filled++;
    if (formData.description) filled++;

    return Math.round((filled / total) * 100);
  };

  const completeness = calculateCompleteness();

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
      const res = await fetch("/api/profile/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          uid: user.uid,
          email: user.email
        }),
      });

      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
        alert(data.error || "Error al guardar perfil.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras verificamos autenticación
  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no hay usuario, no mostramos nada (redirección en curso)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 shadow-black/5">
        <div className="mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
            {isUpdate ? "Editar perfil de empresa" : "Crear perfil de empresa"}
          </h1>
          <p className="text-slate-500">
            Completa el perfil de tu empresa para publicar ofertas verificadas.
          </p>
        </div>

        {/* Barra de progreso */}
        {profileLoaded && (
          <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-indigo-800">Perfil completado</span>
              <span className="text-sm font-bold text-indigo-600">{completeness}%</span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completeness}%`}}
              ></div>
            </div>
            {completeness < 100 && (
              <p className="text-xs text-indigo-600 mt-2">
                💡 Completa más datos para aumentar tu visibilidad
              </p>
            )}
          </div>
        )}

        {/* Información sobre privacidad de datos */}
        <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-indigo-800">
            <strong>Tus datos de contacto (teléfono, email, dirección) son privados y solo se compartirán con candidatos en los que estés interesado.</strong> El nombre de tu empresa será público en las ofertas que publiques.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Datos básicos de la empresa */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Datos de la empresa
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la empresa / Razón social *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Agrofruta Huelva S.L."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CIF *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: B12345678"
                maxLength={9}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200 uppercase font-mono"
                value={formData.cif}
                onChange={(e) => setFormData({ ...formData, cif: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Introduce el CIF sin espacios ni guiones. El CIF no se modificará una vez guardado por razones de seguridad.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción de la empresa
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Empresa dedicada al cultivo y comercialización de fresas y fresones en Huelva desde 1995..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200 resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sitio web (opcional)
              </label>
              <input
                type="url"
                placeholder="Ej: https://www.miempresa.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          {/* Datos de contacto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Persona de contacto
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la persona de contacto
              </label>
              <input
                type="text"
                placeholder="Ej: Juan García García"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teléfono de contacto *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: 959 123 456"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Dirección
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Provincia *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                >
                  <option value="">Selecciona...</option>
                  {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ciudad / Localidad *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dirección completa
              </label>
              <input
                type="text"
                placeholder="Ej: Polígono Industrial La Red, Calle A, Nave 5"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition-all duration-200"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold py-4 rounded-2xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none text-lg flex items-center justify-center gap-2"
          >
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
                {isUpdate ? "Actualizar perfil" : "Crear perfil"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
