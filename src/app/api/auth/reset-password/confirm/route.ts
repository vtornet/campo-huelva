import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * Endpoint para confirmar el cambio de contraseña usando Firebase Admin SDK
 * Esto evita las redirecciones automáticas del cliente Firebase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oobCode, newPassword } = body;

    // Validaciones
    if (!oobCode || !newPassword) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Inicializar Firebase Admin
    const adminAuth = initFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Obtener Auth instance con los métodos correctos
    const auth = getAuth();

    // Verificar el código primero (para obtener el email)
    let email: string;
    try {
      email = await auth.verifyPasswordResetCode(oobCode);
    } catch (error: any) {
      console.error("[reset-password] Error al verificar código:", error);
      return NextResponse.json(
        {
          error: error.code === "auth/expired-action-code"
            ? "El enlace ha expirado"
            : error.code === "auth/invalid-action-code"
            ? "Enlace inválido"
            : "Error al verificar el enlace"
        },
        { status: 400 }
      );
    }

    // Confirmar el reset de contraseña
    try {
      await auth.confirmPasswordReset(oobCode, newPassword);
      console.log(`[reset-password] Contraseña cambiada para ${email}`);
    } catch (error: any) {
      console.error("[reset-password] Error al confirmar reset:", error);
      return NextResponse.json(
        { error: "Error al cambiar la contraseña" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contraseña cambiada correctamente",
    });

  } catch (error: any) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
