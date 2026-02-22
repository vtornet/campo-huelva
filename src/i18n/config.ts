/**
 * Configuración de internacionalización para Red Agro
 * Soporta: Español (es), Francés (fr), Rumano (ro), Inglés (en)
 */

export const defaultLocale = "es";
export const locales = ["es", "fr", "ro", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  es: "Español",
  fr: "Français",
  ro: "Română",
  en: "English",
};

export const localeFlags: Record<Locale, string> = {
  es: "🇪🇸",
  fr: "🇫🇷",
  ro: "🇷🇴",
  en: "🇬🇧",
};
