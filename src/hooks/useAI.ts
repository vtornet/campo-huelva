// src/hooks/useAI.ts
// Hook personalizado para interactuar con las funciones de IA

import { useState, useCallback } from 'react';

interface GenerarDescripcionParams {
  rol: 'USER' | 'WORKER' | 'FOREMAN' | 'ENGINEER';
  fullName?: string;
  experience?: string[];
  yearsExperience?: number;
  hasVehicle?: boolean;
  canRelocate?: boolean;
  machineryExperience?: string[];
  phytosanitaryLevel?: string;
  foodHandler?: boolean;
  crewSize?: number;
  specialties?: string[];
  hasVan?: boolean;
  ownTools?: boolean;
  workArea?: string[];
  collegiateNumber?: string;
  cropExperience?: string[];
  servicesOffered?: string[];
}

interface RecomendarOfertasParams {
  userId: string;
}

interface RecomendarTrabajadoresParams {
  postId: string;
  companyId?: string;
}

interface MejorarOfertaParams {
  titulo?: string;
  descripcion: string;
  provincia?: string;
  tipo?: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genera una descripción de perfil usando IA
   */
  const generarDescripcion = useCallback(async (params: GenerarDescripcionParams): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/profile-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar descripción');
      }

      const data = await response.json();
      return data.descripcion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene recomendaciones de ofertas para un trabajador
   */
  const recomendarOfertas = useCallback(async (params: RecomendarOfertasParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al obtener recomendaciones');
      }

      const data = await response.json();
      return data.offers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene recomendaciones de trabajadores para una oferta
   */
  const recomendarTrabajadores = useCallback(async (params: RecomendarTrabajadoresParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend-workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al obtener recomendaciones');
      }

      const data = await response.json();
      return data.workers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mejora la descripción de una oferta
   */
  const mejorarDescripcionOferta = useCallback(async (params: MejorarOfertaParams): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/improve-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al mejorar la descripción');
      }

      const data = await response.json();
      return data.improved;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generarDescripcion,
    recomendarOfertas,
    recomendarTrabajadores,
    mejorarDescripcionOferta,
  };
}
