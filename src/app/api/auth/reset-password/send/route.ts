import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";

function createPasswordResetEmailHtml(email: string, resetLink: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recupera tu contraseña - Agro Red</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 10px;">🔑</div>
    <h1 style="color: white; margin: 0; font-size: 24px;">Agro Red</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Recupera tu contraseña</p>
  </div>

  <div style="background: #f9fafb; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0; color: #1f2937;">¿Olvidaste tu contraseña?</h2>

    <p style="color: #4b5563; margin-bottom: 20px;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Agro Red</strong>.
    </p>

    <p style="color: #4b5563; margin-bottom: 20px;">
      Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña seguirá siendo la misma.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 25px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Email registrado:</p>
      <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${email}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}"
         style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        🔐 Restablecer contraseña
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 10px;">
      o copia y pega este enlace en tu navegador:
    </p>
    <p style="color: #059669; font-size: 12px; text-align: center; word-break: break-all; margin: 0;">
      ${resetLink}
    </p>

    <div style="margin-top: 30px; padding: 15px; background: #fffbeb; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #92400e; font-size: 13px;">
        <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora. Si no lo usas en este periodo, tendrás que solicitar un nuevo enlace.
      </p>
    </div>
  </div>

  <div style="background: #1f2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">Si no solicitaste restablecer tu contraseña, tu cuenta sigue segura.</p>
    <p style="margin: 5px 0 0 0;">© 2026 Agro Red - agroredjob.com</p>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = checkRateLimit(request, 'reset-password', {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
      message: 'Has enviado demasiadas solicitudes. Por favor, espera unos minutos.',
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Has enviado demasiadas solicitudes.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString() } }
      );
    }

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const adminAuth = initFirebaseAdmin();
    if (!adminAuth) {
      return NextResponse.json({ error: "Error de configuración" }, { status: 500 });
    }

    // CAMBIO: Generar enlace que apunta a /login en lugar de /reset-password
    // Esto evita que Firebase redirija de vuelta a /reset-password después del cambio
    const resetLink = await adminAuth.generatePasswordResetLink(
      email,
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com"}/login`,
        handleCodeInApp: true,
      }
    );

    console.log(`[reset-password] Enlace generado para ${email}`);

    let emailSent = false;
    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [email],
          subject: "Recupera tu contraseña - Agro Red",
          html: createPasswordResetEmailHtml(email, resetLink),
          tags: [{ name: 'type', value: 'password_reset' }],
        });
        if (!error) {
          console.log(`[reset-password] Email enviado a ${email}`);
          emailSent = true;
        }
      } catch (emailErr: any) {
        console.error("[reset-password] Error al enviar email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? "Si el email está registrado, recibirás un enlace." : "Solicitud procesada.",
      emailSent,
      link: resetLink,
    });

  } catch (error: any) {
    console.error("[reset-password] Error:", error);
    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ success: true, message: "Si el email está registrado, recibirás un enlace." });
    }
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
