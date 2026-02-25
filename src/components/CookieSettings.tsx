'use client';

import React from 'react';
import { useCookies } from '@/context/CookieContext';
import { X } from 'lucide-react';

interface CookieCategoryInfo {
  id: 'analytics' | 'marketing';
  name: string;
  description: string;
  examples: string[];
}

const cookieCategories: CookieCategoryInfo[] = [
  {
    id: 'analytics',
    name: 'Cookies Analíticas',
    description: 'Nos ayudan a entender cómo usas la plataforma para mejorarla.',
    examples: ['Google Analytics', 'Estadísticas de uso'],
  },
  {
    id: 'marketing',
    name: 'Cookies de Marketing',
    description: 'Se utilizan para mostrarte contenidos relevantes.',
    examples: ['Personalización de contenido', 'Publicidad (futuro)'],
  },
];

export function CookieSettings() {
  const { consent, savePreferences, showSettings, closeSettings, acceptAll, rejectNonNecessary } = useCookies();

  const [localPreferences, setLocalPreferences] = React.useState({
    analytics: consent.preferences.analytics,
    marketing: consent.preferences.marketing,
  });

  React.useEffect(() => {
    setLocalPreferences({
      analytics: consent.preferences.analytics,
      marketing: consent.preferences.marketing,
    });
  }, [consent.preferences]);

  const handleSave = () => {
    savePreferences(localPreferences);
  };

  const handleClose = () => {
    // Revertir cambios
    setLocalPreferences({
      analytics: consent.preferences.analytics,
      marketing: consent.preferences.marketing,
    });
    closeSettings();
  };

  return (
    <>
      {/* Backdrop */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
          onClick={handleClose}
        />
      )}

      {/* Modal */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configuración de Cookies
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Elige qué cookies permitir
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Siempre activas */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Cookies Necesarias
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Siempre activas. Esenciales para el funcionamiento.
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 pl-13">
                <p>Ejemplos:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Autenticación de usuarios (Firebase)</li>
                  <li>Sesión y seguridad</li>
                  <li>Preferencias básicas</li>
                </ul>
              </div>
            </div>

            {/* Opcionales */}
            <div className="space-y-4">
              {cookieCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Ejemplos: {category.examples.join(', ')}
                      </p>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() =>
                        setLocalPreferences((prev) => ({
                          ...prev,
                          [category.id]: !prev[category.id],
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                        localPreferences[category.id]
                          ? 'bg-green-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      role="switch"
                      aria-checked={localPreferences[category.id]}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          localPreferences[category.id] ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Info adicional */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 Puedes cambiar estos preferences en cualquier momento desde{' '}
                <a href="/cookies" className="underline hover:text-blue-600">
                  Política de Cookies
                </a>
                .
              </p>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={rejectNonNecessary}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Rechazar todas
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aceptar todas
              </button>
            </div>
            <button
              onClick={handleSave}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
            >
              Guardar mis preferencias
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
