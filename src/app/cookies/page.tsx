'use client';

import { Metadata } from "next";
import Link from "next/link";
import { CookiePreferencesButton, CookieConsentStatus } from "@/components/CookiePreferences";
import { PageBackButton } from "@/components/BackButton";

// En Next.js 15 con app router, la metadata se exporta desde un archivo separado
// o se genera dinámicamente. Para este cliente component, añadimos el título al head.

export default function CookiePolicy() {
  const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      {/* Meta tags para cliente */}
      <title>Política de Cookies | Red Agro</title>
      <meta name="description" content="Política de Cookies de Red Agro. Información sobre las cookies que utilizamos." />

      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Botón volver */}
          <PageBackButton />

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Política de Cookies</h1>
            <p className="text-slate-500">Última actualización: {fechaActual}</p>
          </div>

          {/* Configuración actual */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Tu Configuración de Cookies</h2>
            <CookieConsentStatus />
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8 text-slate-700 leading-relaxed">

            {/* 1. ¿Qué son las cookies? */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">1. ¿Qué son las Cookies?</h2>
              <p className="mb-3">
                Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador,
                tablet o smartphone) cuando visitas una página web. Sirven para recordar tus preferencias y
                mejorar tu experiencia de navegación.
              </p>
              <p>
                Las cookies son ampliamente utilizadas en la web y no dañan tu dispositivo. Puedes controlar
                y gestionar las cookies desde la configuración de tu navegador.
              </p>
            </section>

            {/* 2. Tipos de cookies */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">2. Tipos de Cookies que Utilizamos</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-4 py-2 text-left">Tipo</th>
                      <th className="border border-slate-200 px-4 py-2 text-left">Finalidad</th>
                      <th className="border border-slate-200 px-4 py-2 text-left">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-4 py-2 font-semibold">Técnicas / necesarias</td>
                      <td className="border border-slate-200 px-4 py-2">
                        Autenticación, mantenimiento de sesión, seguridad, carga de contenido
                      </td>
                      <td className="border border-slate-200 px-4 py-2">Sesión / 1 año</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="border border-slate-200 px-4 py-2 font-semibold">De preferencias</td>
                      <td className="border border-slate-200 px-4 py-2">
                        Recordar tu idioma, filtros aplicados y otras preferencias de navegación
                      </td>
                      <td className="border border-slate-200 px-4 py-2">1 año</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-4 py-2 font-semibold">Analíticas</td>
                      <td className="border border-slate-200 px-4 py-2">
                        Análisis de uso de la plataforma para mejorar el servicio
                      </td>
                      <td className="border border-slate-200 px-4 py-2">2 años</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Cookies específicas */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">3. Cookies Específicas Utilizadas</h2>

              <h3 className="font-semibold text-slate-800 mb-2">3.1. Cookies de Firebase (Google LLC)</h3>
              <p className="mb-3">
                Utilizamos Firebase para la autenticación de usuarios y servicios de base de datos:
              </p>
              <ul className="list-disc ml-6 mb-4 space-y-1">
                <li><code className="bg-slate-100 px-1 rounded text-xs">__session</code> - Gestión de sesión de usuario</li>
                <li><code className="bg-slate-100 px-1 rounded text-xs">firebaseLocalStorage</code> - Almacenamiento local de autenticación</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.2. Cookies técnicas de la plataforma</h3>
              <ul className="list-disc ml-6 mb-4 space-y-1">
                <li>Gestión de autenticación y sesiones</li>
                <li>Almacenamiento de preferencias de filtros (provincia, tipo de publicación)</li>
                <li>Token de acceso a la API</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">3.3. Cookies de PWA (Progressive Web App)</h3>
              <p>
                Cuando la app está instalada, se utilizan cookies para recordar la instalación y mejorar
                el rendimiento (service workers, cache).
              </p>
            </section>

            {/* 4. Control de cookies */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">4. ¿Cómo Controlar las Cookies?</h2>

              <h3 className="font-semibold text-slate-800 mb-2">4.1. Panel de configuración</h3>
              <p className="mb-3">
                Puedes cambiar tus preferencias de cookies en cualquier momento:
              </p>
              <div className="mb-4">
                <CookiePreferencesButton />
              </div>

              <h3 className="font-semibold text-slate-800 mb-2">4.2. Ajustes en tu navegador</h3>
              <p className="mb-3">
                También puedes configurar tu navegador para rechazar cookies o eliminar las ya instaladas:
              </p>
              <ul className="list-disc ml-6 mb-4 space-y-1">
                <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
                <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
                <li><strong>Safari (iOS/Mac):</strong> Preferencias → Privacidad → Gestión de datos de sitios web</li>
                <li><strong>Edge:</strong> Configuración → Cookies y permisos de sitio</li>
              </ul>

              <h3 className="font-semibold text-slate-800 mb-2">4.3. Aviso importante</h3>
              <p className="text-sm text-slate-600">
                Deshabilitar las cookies técnicas puede afectar el funcionamiento de la plataforma. Es posible
                que no puedas iniciar sesión o usar ciertas características si bloqueas todas las cookies.
              </p>
            </section>

            {/* 5. Cookies de terceros */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">5. Cookies de Terceros</h2>
              <p className="mb-3">
                Red Agro puede incluir enlaces a sitios web de terceros o integrar servicios de terceros
                que utilizan sus propias cookies. Estas incluyen:
              </p>
              <ul className="list-disc ml-6 mb-3 space-y-1">
                <li><strong>Firebase Authentication:</strong> Servicio de Google para inicio de sesión</li>
                <li><strong>Google (opcional):</strong> Si decides iniciar sesión con tu cuenta de Google</li>
              </ul>
              <p className="text-sm text-slate-600">
                Recomendamos revisar las políticas de cookies de estos terceros en sus respectivos sitios web.
              </p>
            </section>

            {/* 6. Actualizaciones */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">6. Actualizaciones de la Política</h2>
              <p>
                Podemos actualizar esta Política de Cookies para reflejar cambios en el uso de tecnologías
                o por requisitos legales. Te recomendamos revisarla periódicamente.
              </p>
            </section>

            {/* 7. Contacto */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">7. Contacto</h2>
              <p>
                Para cualquier duda sobre las cookies, puedes contactar con nosotros en
                <a href="mailto:contact@appstracta.app" className="text-blue-600 hover:underline ml-1">contact@appstracta.app</a>.
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row gap-4 text-sm">
              <Link href="/privacy" className="text-blue-600 hover:underline">Política de Privacidad</Link>
              <Link href="/terms" className="text-blue-600 hover:underline">Términos y Condiciones</Link>
              <Link href="/legal" className="text-blue-600 hover:underline">Aviso Legal</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
