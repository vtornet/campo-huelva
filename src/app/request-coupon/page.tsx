"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { Gift, Loader2, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function RequestCouponPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    companySize: "",
  });

  // Si no está autenticado, redirigir a login
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.reason.trim().length < 20) {
      showNotification({
        type: "error",
        title: "Razón demasiado corta",
        message: "Por favor, explica por qué quieres probar Agro Red (mínimo 20 caracteres)",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch("/api/coupons/request", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al solicitar cupón");
      }

      setSubmitted(true);
      showNotification({
        type: "success",
        title: "Solicitud enviada",
        message: data.message || "Te enviaremos un email cuando sea aprobada",
      });
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Error",
        message: error.message || "No se pudo enviar la solicitud",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Gift className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicita tu cupón de oferta gratis
          </h1>
          <p className="text-gray-600">
            Publica tu primera oferta sin coste y descubre cómo funciona Agro Red
          </p>
        </div>

        {/* Formulario */}
        {!submitted ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ¿Por qué quieres probar Agro Red? *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Cuéntanos sobre tus necesidades de contratación, qué tipo de perfiles buscas, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                  minLength={20}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Mínimo 20 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamaño de tu empresa
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecciona...</option>
                  <option value="1-10">1-10 trabajadores</option>
                  <option value="11-50">11-50 trabajadores</option>
                  <option value="51-100">51-100 trabajadores</option>
                  <option value="100+">Más de 100 trabajadores</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>¿Qué incluye el cupón?</strong><br />
                  • Publicación de 1 oferta durante 30 días<br />
                  • Visible en el feed principal<br />
                  • Recibe candidatos y contacta con ellos
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Solicitar cupón gratis
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                Revisaremos tu solicitud y te enviaremos el código por email
              </p>
            </form>
          </div>
        ) : (
          // Confirmación
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Solicitud enviada!
            </h2>
            <p className="text-gray-600 mb-6">
              Revisaremos tu solicitud y te enviaremos el código del cupón a tu email.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-800">
                <strong>Pasos siguientes:</strong><br />
                1. Recibirás un email con el código del cupón<br />
                2. Ve a "Publicar oferta" e introduce el código<br />
                3. Tu oferta estará visible 30 días
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
