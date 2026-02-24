// src/lib/api-client.ts
// Cliente HTTP para peticiones autenticadas a la API

import { auth } from "./firebase";

/**
 * Opciones para peticiones a la API
 */
export interface ApiRequestOptions extends RequestInit {
  /** Incluir automáticamente el token de autenticación */
  authenticated?: boolean;
}

/**
 * Obtiene el token de ID del usuario actual de Firebase
 * @returns El token de ID o null si no hay usuario autenticado
 */
export async function getCurrentToken(): Promise<string | null> {
  if (!auth.currentUser) {
    return null;
  }

  try {
    // forceRefresh=false para usar el token en caché cuando sea posible
    const token = await auth.currentUser.getIdToken(false);
    return token;
  } catch (error) {
    console.error("Error al obtener token de Firebase:", error);
    return null;
  }
}

/**
 * Realiza una petición fetch autenticada a la API
 * Incluye automáticamente el token de Firebase en el header Authorization
 *
 * @param url - La URL de la API
 * @param options - Opciones de la petición
 * @returns La respuesta de la petición
 *
 * @example
 * ```tsx
 * const response = await apiFetch("/api/user/me");
 * const data = await response.json();
 * ```
 */
export async function apiFetch(url: string, options: ApiRequestOptions = {}): Promise<Response> {
  const { authenticated = true, ...fetchOptions } = options;

  // Si se requiere autenticación, obtener el token
  if (authenticated) {
    const token = await getCurrentToken();

    if (!token) {
      // No hay token, retornar respuesta de error
      return new Response(
        JSON.stringify({ error: "No autenticado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Añadir el token a los headers
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Asegurar que Content-Type esté establecido para peticiones con body
  const headers = fetchOptions.headers as Record<string, string> | undefined;
  if (fetchOptions.body && headers?.["Content-Type"] === undefined) {
    fetchOptions.headers = {
      ...headers,
      "Content-Type": "application/json",
    } as HeadersInit;
  }

  return fetch(url, fetchOptions);
}

/**
 * Realiza una petición GET autenticada
 */
export async function apiGet<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: "GET" });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Error en la petición");
  }

  return response.json();
}

/**
 * Realiza una petición POST autenticada
 */
export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Error en la petición");
  }

  return response.json();
}

/**
 * Realiza una petición PUT autenticada
 */
export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  const response = await apiFetch(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Error en la petición");
  }

  return response.json();
}

/**
 * Realiza una petición DELETE autenticada
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  const response = await apiFetch(url, { method: "DELETE" });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(error.error || "Error en la petición");
  }

  return response.json();
}

/**
 * Hook personalizado para refrescar el token de autenticación
 * Útil antes de operaciones críticas
 */
export async function refreshToken(): Promise<string | null> {
  if (!auth.currentUser) {
    return null;
  }

  try {
    // forceRefresh=true para obtener un token nuevo del servidor
    const token = await auth.currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error("Error al refrescar token:", error);
    return null;
  }
}
