// src/lib/ai-cache.ts
// Sistema de caché en memoria para respuestas de IA
// Reduce llamadas a la API Gemini almacenando resultados anteriores

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Genera una clave de caché única basada en el contenido
 * Usa hash simple para evitar colisiones
 */
function generateCacheKey(prefix: string, content: Record<string, any>): string {
  // Ordenar las claves para consistencia
  const sortedContent = Object.keys(content)
    .sort()
    .reduce((result: any, key) => {
      result[key] = content[key];
      return result;
    }, {});

  const stringified = JSON.stringify(sortedContent);

  // Hash simple (sum de códigos de caracteres)
  let hash = 0;
  for (let i = 0; i < stringified.length; i++) {
    const char = stringified.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a entero de 32 bits
  }

  return `${prefix}:${Math.abs(hash)}`;
}

/**
 * Clase para gestionar el caché de respuestas de IA
 */
class AICache {
  private cache: Map<string, CacheEntry> = new Map();

  // Tiempos de expiración por tipo (en milisegundos)
  private readonly TTL = {
    PROFILE_DESCRIPTION: 24 * 60 * 60 * 1000, // 24 horas
    RECOMMEND_OFFERS: 30 * 60 * 1000,         // 30 minutos
    RECOMMEND_WORKERS: 30 * 60 * 1000,        // 30 minutos
    IMPROVE_OFFER: 60 * 60 * 1000,            // 1 hora
  };

  /**
   * Obtiene un valor del caché
   */
  get(type: keyof typeof this.TTL, content: Record<string, any>): any | null {
    const key = generateCacheKey(type, content);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar si ha expirado
    const now = Date.now();
    if (now - entry.timestamp > this.TTL[type]) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[AI Cache] HIT: ${key}`);
    return entry.data;
  }

  /**
   * Guarda un valor en el caché
   */
  set(type: keyof typeof this.TTL, content: Record<string, any>, data: any): void {
    const key = generateCacheKey(type, content);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
    console.log(`[AI Cache] SET: ${key}`);

    // Limpiar entradas antiguas periódicamente
    this.cleanup();
  }

  /**
   * Elimina una entrada específica del caché
   */
  invalidate(type: string, content: Record<string, any>): void {
    const key = generateCacheKey(type, content);
    this.cache.delete(key);
    console.log(`[AI Cache] INVALIDATE: ${key}`);
  }

  /**
   * Limpia entradas expiradas del caché
   */
  private cleanup(): void {
    const now = Date.now();
    const maxEntries = 500; // Límite para evitar uso excesivo de memoria

    // Si hay muchas entradas, limpiar las más antiguas
    if (this.cache.size > maxEntries) {
      const entries = Array.from(this.cache.entries());
      // Ordenar por timestamp (más antiguas primero)
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Eliminar el 20% más antiguo
      const toDelete = Math.floor(maxEntries * 0.2);
      for (let i = 0; i < toDelete; i++) {
        this.cache.delete(entries[i][0]);
      }
      console.log(`[AI Cache] CLEANUP: Eliminadas ${toDelete} entradas antiguas`);
    }
  }

  /**
   * Limpia todo el caché (útil para pruebas o reset)
   */
  clear(): void {
    this.cache.clear();
    console.log('[AI Cache] CLEARED');
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }
}

// Instancia singleton del caché
const aiCache = new AICache();

/**
 * Wrapper para funciones de IA con caché
 * @param type - Tipo de caché a usar
 * @param content - Contenido para generar la clave
 * @param fn - Función a ejecutar si no hay caché
 */
export async function withAICache<T>(
  type: keyof typeof AICache.prototype['TTL'],
  content: Record<string, any>,
  fn: () => Promise<T>
): Promise<T> {
  // Intentar obtener del caché
  const cached = aiCache.get(type, content);
  if (cached !== null) {
    return cached as T;
  }

  // Ejecutar la función y guardar en caché
  const result = await fn();
  aiCache.set(type, content, result);

  return result;
}

/**
 * Invalida una entrada específica del caché
 */
export function invalidateAICache(type: string, content: Record<string, any>): void {
  aiCache.invalidate(type, content);
}

/**
 * Limpia todo el caché
 */
export function clearAICache(): void {
  aiCache.clear();
}

/**
 * Obtiene estadísticas del caché
 */
export function getAICacheStats() {
  return aiCache.getStats();
}
