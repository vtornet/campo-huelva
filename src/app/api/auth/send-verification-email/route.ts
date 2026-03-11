import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

// Inicializar Resend si hay API key
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email desde el que se envían los emails (configurado en Resend)
// NOTA: onboarding@resend.dev solo funciona para emails de prueba
// Después de verificar el dominio, cambiar a noreply@agroredjob.com
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";
// Para usar dominio propio: noreply@agroredjob.com (requiere verificar dominio en Resend)

/**
 * Template HTML para el email de verificación
 */
function createVerificationEmailHtml(email: string, verificationLink: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email - Agro Red</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
    <h1 style="color: white; margin: 0; font-size: 24px;">Agro Red</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Verifica tu dirección de email</p>
  </div>

  <div style="background: #f9fafb; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0; color: #1f2937;">¡Bienvenido a Agro Red!</h2>

    <p style="color: #4b5563; margin-bottom: 20px;">
      Gracias por registrarte en <strong>Agro Red</strong>, la plataforma de empleo agrícola que conecta a trabajadores, jefes de cuadrilla y empresas del sector.
    </p>

    <p style="color: #4b5563; margin-bottom: 20px;">
      Para completar tu registro y acceder a todas las funcionalidades, necesitamos verificar tu dirección de email.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 25px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Email registrado:</p>
      <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${email}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}"
         style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        ✅ Verificar mi email
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 10px;">
      o copia y pega este enlace en tu navegador:
    </p>
    <p style="color: #059669; font-size: 12px; text-align: center; word-break: break-all; margin: 0;">
      ${verificationLink}
    </p>

    <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 24 horas. Si no verificas tu email en este periodo, tendrás que solicitar un nuevo enlace.
      </p>
    </div>
  </div>

  <div style="background: #1f2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">Si no creaste una cuenta en Agro Red, puedes ignorar este email.</p>
    <p style="margin: 5px 0 0 0;">© 2026 Agro Red - agroredjob.com</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Endpoint para enviar email de verificación usando Resend
 *
 * Flujo:
 * 1. Verifica que el usuario está autenticado
 * 2. Genera enlace de verificación con Firebase Admin SDK
 * 3. Envía el email usando Resend (más fiable que Firebase Client SDK)
 * 4. Devuelve el enlace como fallback
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar rate limiting (5 emails por hora)
    const rateLimitResult = checkRateLimit(
      request,
      'verify-email',
      {
        maxRequests: 5,
        windowMs: 60 * 60 * 1000, // 1 hora
        message: 'Has enviado demasiadas solicitudes. Por favor, espera unos minutos.',
      }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes. Por favor, espera unos minutos.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

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

    // Generar enlace de verificación usando Firebase Admin SDK
    const verificationLink = await adminAuth.generateEmailVerificationLink(
      user.email!,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com"}/verify-email`,
      }
    );

    console.log(`[verify-email] Enlace generado para ${user.email}: ${verificationLink}`);

    // Enviar email usando Resend
    let emailSent = false;
    let emailError: string | null = null;

    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [user.email!],
          subject: "Verifica tu email - Agro Red",
          html: createVerificationEmailHtml(user.email!, verificationLink),
          tags: [
            { name: 'type', value: 'email_verification' },
            { name: 'user_id', value: uid },
          ],
        });

        if (error) {
          console.error("[verify-email] Error al enviar email con Resend:", error);
          emailError = error.message;
        } else {
          console.log(`[verify-email] Email enviado exitosamente a ${user.email}`);
          emailSent = true;
        }
      } catch (emailErr: any) {
        console.error("[verify-email] Excepción al enviar email:", emailErr);
        emailError = emailErr?.message || "Error desconocido";
      }
    } else {
      console.warn("[verify-email] RESEND_API_KEY no configurada. Email no enviado.");
      emailError = "Servicio de email no configurado";
    }

    // Siempre devolvemos el enlace como fallback
    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Email enviado correctamente"
        : "No se pudo enviar el email automáticamente",
      link: verificationLink,
      emailSent,
      emailError,
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
