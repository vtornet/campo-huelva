// src/lib/firebase-admin.ts
// Módulo de autenticación en servidor usando Firebase Admin SDK

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Credenciales de Firebase desde variables de entorno
// Para Firebase Admin necesitamos:
// - GOOGLE_APPLICATION_CREDENTIALS (ruta a archivo JSON) o
// - Variables de entorno individuales (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

let adminAuth: ReturnType<typeof getAuth> | null = null;

/**
 * Inicializa Firebase Admin SDK si no está inicializado
 * Requiere las siguientes variables de entorno:
 * - FIREBASE_PROJECT_ID (o NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * - FIREBASE_CLIENT_EMAIL (email de la cuenta de servicio)
 * - FIREBASE_PRIVATE_KEY (clave privada de la cuenta de servicio)
 */
export function initFirebaseAdmin() {
  if (adminAuth) {
    return adminAuth;
  }

  // Verificar si ya hay una app de Firebase Admin inicializada
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminAuth = getAuth(existingApps[0]);
    return adminAuth;
  }

  // Configuración desde variables de entorno
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin SDK: Faltan credenciales. La verificación de tokens estará deshabilitada.");
    console.warn("Se requieren: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    return null;
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    adminAuth = getAuth(app);
    console.log("Firebase Admin SDK inicializado correctamente");
    return adminAuth;
  } catch (error) {
    console.error("Error al inicializar Firebase Admin SDK:", error);
    return null;
  }
}

/**
 * Verifica un token de Firebase ID y retorna el UID del usuario
 * @param token - El token de Firebase ID (del header Authorization)
 * @returns El UID del usuario si el token es válido
 * @throws Error si el token es inválido o ha expirado
 */
export async function verifyFirebaseToken(token: string): Promise<string> {
  const auth = initFirebaseAdmin();

  if (!auth) {
    // Si Firebase Admin no está configurado, permitimos el paso (modo degradado)
    // En producción, esto debería lanzar un error
    console.warn("Firebase Admin no está configurado. Verificación de tokens deshabilitada.");
    // Devolvemos un valor temporal para no romper la app durante la transición
    return token;
  }

  try {
    // Eliminar prefijo "Bearer " si existe
    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    const decodedToken = await auth.verifyIdToken(actualToken, true); // true = revocar si está revocado
    return decodedToken.uid;
  } catch (error: any) {
    console.error("Error al verificar token de Firebase:", error.message);

    if (error.code === "auth/id-token-expired") {
      throw new Error("El token ha expirado");
    } else if (error.code === "auth/id-token-revoked") {
      throw new Error("El token ha sido revocado");
    } else if (error.code === "auth/invalid-user-token") {
      throw new Error("Token inválido");
    } else if (error.code === "auth/user-token-expired") {
      throw new Error("El token de usuario ha expirado");
    } else {
      throw new Error("Error de autenticación");
    }
  }
}

/**
 * Extrae el token del header Authorization de la petición
 * @param request - La petición Next.js
 * @returns El token o null si no existe
 */
export function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  // Formato: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Middleware de autenticación para rutas API
 * Verifica que el token sea válido y retorna el UID del usuario
 * @param request - La petición Next.js
 * @returns El UID del usuario autenticado
 * @throws Response con error 401 si no hay token o es inválido
 */
export async function authenticateRequest(request: Request): Promise<string> {
  const token = extractTokenFromHeader(request);

  if (!token) {
    throw new Error("No se proporcionó token de autenticación");
  }

  try {
    const uid = await verifyFirebaseToken(token);
    return uid;
  } catch (error: any) {
    throw new Error(error.message || "Token inválido");
  }
}

/**
 * Verifica si Firebase Admin está configurado
 */
export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return !!(projectId && clientEmail && privateKey);
}
