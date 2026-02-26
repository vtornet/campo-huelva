import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { PageBackButton } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contacta con el equipo de Red Agro. Estamos aquí para ayudarte.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Botón volver */}
        <PageBackButton />

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">
            Contacta con Nosotros
          </h1>
          <p className="text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos en un máximo de 48 horas.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="lg:col-span-1 space-y-6">
            {/* Email */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Email</h3>
                  <a
                    href="mailto:contact@appstracta.app"
                    className="text-sm text-green-600 dark:text-green-400 hover:underline"
                  >
                    contact@appstracta.app
                  </a>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Ubicación</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Lepe, Huelva
                    <br />
                    España
                  </p>
                </div>
              </div>
            </div>

            {/* Horario de respuesta */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">Tiempo de respuesta</h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    Máximo 48 horas
                    <br />
                    Lun - Vie
                  </p>
                </div>
              </div>
            </div>

            {/* Preguntas frecuentes */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">
                ¿Necesitas ayuda rápida?
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/terms" className="text-green-600 dark:text-green-400 hover:underline">
                    → Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-green-600 dark:text-green-400 hover:underline">
                    → Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-green-600 dark:text-green-400 hover:underline">
                    → Política de Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
                Envíanos un mensaje
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>

        {/* Información legal adicional */}
        <div className="mt-10 text-center text-sm text-slate-500 dark:text-gray-400">
          <p>
            Los datos personales recogidos en este formulario serán tratados por{' '}
            <strong>Appstracta</strong> (Víctor José Tornet García, NIF 77534989B) únicamente para responder
            a tu consulta. Más información en nuestra{' '}
            <a href="/privacy" className="text-green-600 dark:text-green-400 hover:underline">
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
