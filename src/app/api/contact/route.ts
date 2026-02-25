import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { Resend } from 'resend';

// Email de soporte donde se recibirán los mensajes
const SUPPORT_EMAIL = 'contact@appstracta.app';

// Inicializar Resend si hay API key
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// HTML template para el email
function createEmailHtml(data: ContactRequest) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo mensaje de contacto</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Red Agro</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Nuevo mensaje de contacto</p>
  </div>

  <div style="background: #f9fafb; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0; color: #1f2937;">Detalles del mensaje</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Nombre:</strong></td>
        <td style="padding: 8px 0; color: #1f2937;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;"><strong>Email:</strong></td>
        <td style="padding: 8px 0;">
          <a href="mailto:${data.email}" style="color: #059669; text-decoration: none;">${data.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;"><strong>Asunto:</strong></td>
        <td style="padding: 8px 0; color: #1f2937;">${data.subject}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;"><strong>Fecha:</strong></td>
        <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleString('es-ES', {
          dateStyle: 'full',
          timeStyle: 'short',
        })}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; padding: 15px; background: white; border-left: 4px solid #059669; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Mensaje:</strong></p>
      <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${data.message}</p>
    </div>

    <div style="margin-top: 20px; text-align: center;">
      <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}"
         style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Responder mensaje
      </a>
    </div>
  </div>

  <div style="background: #1f2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">Enviado desde el formulario de contacto de Red Agro</p>
    <p style="margin: 5px 0 0 0;">agroredjob.com</p>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limiting (5 mensajes por hora)
    const rateLimitResult = checkRateLimit(
      request,
      'contact',
      {
        maxRequests: 5,
        windowMs: 60 * 60 * 1000, // 1 hora
        message: 'Has enviado demasiados mensajes. Por favor, espera un poco antes de volver a contactar.',
      }
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Has enviado demasiados mensajes. Por favor, espera un poco antes de volver a contactar.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body: ContactRequest = await request.json();

    // Validaciones básicas
    const errors: Record<string, string> = {};

    if (!body.name || body.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = 'Email inválido';
    }

    if (!body.subject || body.subject.trim().length < 3) {
      errors.subject = 'El asunto debe tener al menos 3 caracteres';
    }

    if (!body.message || body.message.trim().length < 10) {
      errors.message = 'El mensaje debe tener al menos 10 caracteres';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Sanitización básica
    const sanitizedName = body.name.trim().slice(0, 100);
    const sanitizedEmail = body.email.trim().toLowerCase().slice(0, 255);
    const sanitizedSubject = body.subject.trim().slice(0, 200);
    const sanitizedMessage = body.message.trim().slice(0, 5000);

    // Enviar email usando Resend
    if (resend) {
      try {
        const emailData = {
          from: 'Red Agro <noreply@appstracta.app>',
          to: [SUPPORT_EMAIL],
          replyTo: sanitizedEmail,
          subject: `📧 Nuevo contacto: ${sanitizedSubject}`,
          html: createEmailHtml({
            name: sanitizedName,
            email: sanitizedEmail,
            subject: sanitizedSubject,
            message: sanitizedMessage,
          }),
        };

        const { error } = await resend.emails.send(emailData);

        if (error) {
          console.error('Error al enviar email con Resend:', error);
          // En producción, quizás quieras retornar error aquí
          // Por ahora, continuamos y retornamos éxito al usuario
        }
      } catch (emailError) {
        console.error('Excepción al enviar email:', emailError);
      }
    } else {
      // Sin API key de Resend, solo log en consola
      console.warn('⚠️ RESEND_API_KEY no configurada. Email no enviado.');
      console.log('📧 Nuevo mensaje de contacto:', {
        from: `${sanitizedName} <${sanitizedEmail}>`,
        subject: sanitizedSubject,
        message: sanitizedMessage,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente. Te responderemos en un máximo de 48 horas.',
      contactEmail: SUPPORT_EMAIL,
    });

  } catch (error) {
    console.error('Error al procesar mensaje de contacto:', error);
    return NextResponse.json(
      { error: 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
