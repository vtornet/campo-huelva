/**
 * Página 404 - No encontrado
 * Se muestra automáticamente cuando Next.js no encuentra una ruta
 */

import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Red Agro"
            width={140}
            height={40}
            priority
          />
        </div>

        {/* Ilustración o icono */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Textos */}
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Página no encontrada</h1>
        <p className="text-slate-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir al inicio
          </Link>
        </div>

        {/* Sugerencias de enlaces útiles */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Quizás estabas buscando:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/profile" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Mi perfil
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/search" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Buscar candidatos
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/publish" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Publicar oferta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
