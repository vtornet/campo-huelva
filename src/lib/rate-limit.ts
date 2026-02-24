// src/lib/rate-limit.ts
// Sistema de rate limiting en memoria para prevenir abusos

/**
 * Almacén de solicitudes por IP y endpoint
 * Estructura: { "ip:endpoint": [{ timestamp: number }] }
 */
const requestStore: Record<string, number[]> = {};

/**
 * Limpia timestamps antiguos del almacén
 */
function cleanupOldTimestamps(timestamps: number[], maxAge: number): number[] {
  const now = Date.now();
  return timestamps.filter((ts) => now - ts < maxAge);
}

/**
 * Configuración de rate limit por defecto
 */
export interface RateLimitConfig {
  /** Número máximo de solicitudes permitidas */
  maxRequests: number;
  /** Período de tiempo en milisegundos */
  windowMs: number;
  /** Mensaje de error personalizado */
  message?: string;
}

/**
 * Configuraciones predefinidas para diferentes tipos de endpoints
 */
export const RateLimitPresets = {
  /** Para endpoints de contacto/mensajes (muy restrictivo) */
  contact: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 mensajes por minuto
    message: "Has enviado demasiados mensajes. Por favor, espera un momento.",
  },
  /** Para inscripciones (restrictivo) */
  applications: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 inscripciones por minuto
    message: "Has hecho demasiadas inscripciones. Por favor, espera un momento.",
  },
  /** Para denuncias (restrictivo) */
  reports: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 denuncias por minuto
    message: "Has enviado demasiadas denuncias. Por favor, espera.",
  },
  /** Para endpoints de búsqueda (menos restrictivo) */
  search: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 búsquedas por minuto
    message: "Has hecho demasiadas búsquedas. Por favor, espera.",
  },
  /** Para endpoints generales */
  default: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 solicitudes por minuto
    message: "Demasiadas solicitudes. Por favor, espera.",
  },
} as const;

/**
 * Obtiene la IP del cliente de la petición
 * Considera proxies y load balancers
 */
export function getClientIp(request: Request): string {
  // Intentar obtener desde headers comunes de proxy
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs, tomar la primera
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback: usar un identificador único de la sesión
  // En desarrollo o sin headers de proxy, no podemos obtener la IP real
  return "unknown";
}

/**
 * Verifica si una petición debe ser rate limitada
 * @param request - La petición Next.js
 * @param endpoint - Identificador del endpoint para agrupar rate limits
 * @param config - Configuración del rate limit
 * @returns true si se permite la petición, false si se debe rechazar
 */
export function checkRateLimit(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RateLimitPresets.default
): { allowed: boolean; remaining: number; resetAt: number } {
  const ip = getClientIp(request);
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  // Obtener timestamps anteriores o inicializar array vacío
  let timestamps = requestStore[key] || [];

  // Limpiar timestamps antiguos
  timestamps = cleanupOldTimestamps(timestamps, config.windowMs);

  // Verificar si se excede el límite
  if (timestamps.length >= config.maxRequests) {
    // Calcular cuándo se permitirá la siguiente petición
    const oldestTimestamp = timestamps[0];
    const resetAt = oldestTimestamp + config.windowMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Añadir timestamp actual
  timestamps.push(now);
  requestStore[key] = timestamps;

  // Calcular cuándo expira la ventana actual
  const newestTimestamp = timestamps[0];
  const resetAt = newestTimestamp + config.windowMs;

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    resetAt,
  };
}

/**
 * Middleware de rate limiting para rutas API
 * Retorna una respuesta de error si se excede el límite
 * @param request - La petición Next.js
 * @param endpoint - Identificador del endpoint
 * @param config - Configuración del rate limit
 * @returns Response con error 429 si se excede el límite, o null si se permite
 */
export function rateLimitMiddleware(
  request: Request,
  endpoint: string,
  config: RateLimitConfig = RateLimitPresets.default
): Response | null {
  const result = checkRateLimit(request, endpoint, config);

  if (!result.allowed) {
    const resetDate = new Date(result.resetAt);
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    return new Response(
      JSON.stringify({
        error: config.message || "Demasiadas solicitudes",
        retryAfter: retryAfter,
        resetAt: resetDate.toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetDate.toISOString(),
        },
      }
    );
  }

  // Añadir headers informativos a la petición (para usar en la respuesta)
  // Nota: En Next.js no podemos modificar la petición original,
  // pero el consumidor puede usar estos valores para añadir headers
  return null;
}

/**
 * Limpia periódicamente entradas antiguas del almacén
 * Se debe llamar desde un cron job o proceso de fondo
 */
export function cleanupRequestStore(): void {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutos

  for (const key in requestStore) {
    const timestamps = requestStore[key];
    const cleaned = cleanupOldTimestamps(timestamps, maxAge);

    if (cleaned.length === 0) {
      delete requestStore[key];
    } else {
      requestStore[key] = cleaned;
    }
  }
}

// Limpiar el almacén cada 5 minutos
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRequestStore, 5 * 60 * 1000);
}
