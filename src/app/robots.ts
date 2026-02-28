import { MetadataRoute } from 'next'

// URL base de la aplicación
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://agroredjob.com'

/**
 * Robots.txt para Agro Red
 * Instrucciones para los crawlers de los buscadores
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/messages/', '/applications/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
