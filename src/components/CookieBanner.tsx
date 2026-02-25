'use client';

import { useCookies } from '@/context/CookieContext';
import { X } from 'lucide-react';

export function CookieBanner() {
  const { acceptAll, rejectNonNecessary, openSettings } = useCookies();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Texto */}
          <div className="flex-1 pr-8">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Usamos cookies</span> para mejorar tu experiencia.
              Las necesarias siempre están activas. Puedes aceptar todas o configurar las opciones.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <a href="/cookies" className="hover:text-green-600 dark:hover:text-green-400 underline">
                Política de Cookies
              </a>
              <a href="/privacy" className="hover:text-green-600 dark:hover:text-green-400 underline">
                Privacidad
              </a>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={rejectNonNecessary}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Rechazar
            </button>
            <button
              onClick={openSettings}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Configurar
            </button>
            <button
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookieBannerMinimal() {
  const { acceptAll, rejectNonNecessary, openSettings } = useCookies();

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-40 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icono de cookie */}
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <span className="text-lg">🍪</span>
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Usamos cookies para mejorar tu experiencia.{' '}
              <a href="/cookies" className="text-green-600 dark:text-green-400 hover:underline">
                Más info
              </a>
            </p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
            <button
              onClick={openSettings}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              title="Configurar cookies"
            >
              ⚙️
            </button>
            <button
              onClick={rejectNonNecessary}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Rechazar no necesarias"
            >
              ✕
            </button>
            <button
              onClick={acceptAll}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              title="Aceptar todas"
            >
              ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
