import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo y marca */}
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">Red Agro</span>
            <span className="text-slate-400 text-sm">© {currentYear} Appstracta</span>
          </div>

          {/* Enlaces legales */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">
              Privacidad
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/terms" className="hover:text-emerald-600 transition-colors">
              Términos
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/cookies" className="hover:text-emerald-600 transition-colors">
              Cookies
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/legal" className="hover:text-emerald-600 transition-colors">
              Aviso Legal
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">
              Contacto
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
