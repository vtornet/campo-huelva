'use client';

import { useCookies } from '@/context/CookieContext';
import { Settings } from 'lucide-react';

/**
 * Botón para abrir el panel de configuración de cookies.
 * Se puede usar en la página de Política de Cookies para permitir cambiar preferencias.
 */
export function CookiePreferencesButton() {
  const { setIsOpen } = useCookies();

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
    >
      <Settings className="w-4 h-4" />
      Cambiar preferencias de cookies
    </button>
  );
}

/**
 * Panel informativo del estado actual de cookies.
 * Muestra qué categorías están activas.
 */
export function CookieConsentStatus() {
  const { consent, resetConsent } = useCookies();

  if (!consent.hasConsented) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-300">
          ⚠️ Aún no has configurado tus preferencias de cookies.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        Tu configuración actual
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Cookies Necesarias</span>
          <span className="text-green-600 dark:text-green-400 font-medium">Activas</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Cookies Analíticas</span>
          <span
            className={`font-medium ${
              consent.preferences.analytics
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {consent.preferences.analytics ? 'Activas' : 'Inactivas'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">Cookies de Marketing</span>
          <span
            className={`font-medium ${
              consent.preferences.marketing
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {consent.preferences.marketing ? 'Activas' : 'Inactivas'}
          </span>
        </div>
      </div>

      {consent.consentDate && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Consentimiento otorgado el {new Date(consent.consentDate).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      )}

      <button
        onClick={resetConsent}
        className="mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
      >
        Restablecer consentimiento
      </button>
    </div>
  );
}
