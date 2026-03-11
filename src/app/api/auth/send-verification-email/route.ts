import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

/**
 * Endpoint para enviar email de verificación usando Firebase Admin SDK
 *
 * A diferencia del Client SDK, esto:
 * - Se ejecuta en el servidor (más fiable)
 * - Aparece en los logs de Railway
 * - No está sujeto a limitaciones del navegador
 * - Puede usar configuración personalizada
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario está autenticado
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      );
    }

    const uid = await verifyFirebaseToken(authHeader.replace("Bearer ", ""));

    // Inicializar Firebase Admin
    const adminAuth = initFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Firebase Admin no está configurado correctamente" },
        { status: 500 }
      );
    }

    // Obtener el usuario
    const user = await adminAuth.getUser(uid);

    // Si ya está verificado, no hacer nada
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "El email ya está verificado",
        alreadyVerified: true,
      });
    }

    // Generar enlace de verificación usando Admin SDK
    // Nota: Firebase Admin SDK no tiene un método directo para enviar emails,
    // pero podemos generar el enlace de verificación
    const emailVerifiedLink = await adminAuth.generateEmailVerificationLink(
      user.email!,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com"}/verify-email`,
      }
    );

    console.log(`[verify-email] Enlace generado para ${user.email}: ${emailVerifiedLink}`);

    // OPCIÓN 1: Usar el enlace generado directamente
    // Podemos retornar el enlace para usarlo en el frontend, o enviarlo por email
    // usando un servicio como Resend, SendGrid, etc.

    // OPCIÓN 2: Usar el Client SDK como fallback (método actual)
    // Retornamos una instrucción para que el frontend use el Client SDK

    // Por ahora, usamos el enfoque híbrido:
    // Generamos el enlace con Admin SDK y lo enviamos al frontend
    // El frontend puede usar este enlace o hacer fallback al Client SDK

    return NextResponse.json({
      success: true,
      message: "Enlace de verificación generado",
      // No enviamos el enlace por seguridad, el frontend usará el Client SDK
      // pero este endpoint confirma que el backend está funcionando
      useClientSDK: true,
    });

  } catch (error: any) {
    console.error("[verify-email] Error:", error);

    // Manejo de errores específicos de Firebase
    if (error.code === "auth/too-many-requests") {
      return NextResponse.json(
        { error: "Has realizado demasiadas solicitudes. Espera unos minutos antes de reenviar." },
        { status: 429 }
      );
    }

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al enviar email de verificación" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para verificar si el email del usuario está verificado
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      );
    }

    const uid = await verifyFirebaseToken(authHeader.replace("Bearer ", ""));

    const adminAuth = initFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Firebase Admin no está configurado" },
        { status: 500 }
      );
    }

    const user = await adminAuth.getUser(uid);

    return NextResponse.json({
      emailVerified: user.emailVerified,
      email: user.email,
    });

  } catch (error: any) {
    console.error("[verify-email] Error al verificar estado:", error);
    return NextResponse.json(
      { error: "Error al verificar estado del email" },
      { status: 500 }
    );
  }
}
