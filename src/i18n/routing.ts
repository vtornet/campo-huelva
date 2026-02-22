import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // Lista de locales soportados
  locales: ["es", "fr", "ro", "en"],

  // Locale por defecto
  defaultLocale: "es",

  // Siempre usar prefijo de locale (ej: /es/login, /fr/login)
  // Necesario porque nuestra estructura de carpetas es /[locale]/
  localePrefix: "always",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
