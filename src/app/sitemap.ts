import { MetadataRoute } from 'next'

// URL base de la aplicación
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agroredjob.com'

/**
 * Sitemap dinámico para Red Agro
 * Genera automáticamente las URLs principales del sitio
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Páginas estáticas principales
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/onboarding`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // TODO: Podemos añadir páginas dinámicas de ofertas en el futuro
  // - /offer/[id] - Ofertas de empleo individuales
  // Necesitaríamos obtener los IDs de las ofertas activas de la BD

  return staticRoutes
}
