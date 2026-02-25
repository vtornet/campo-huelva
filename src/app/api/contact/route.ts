import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

// Email de soporte donde se recibirán los mensajes
const SUPPORT_EMAIL = 'contact@appstracta.app';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
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

    // TODO: Aquí se podría:
    // 1. Enviar email usando un servicio (Resend, SendGrid, etc.)
    // 2. Guardar en base de datos para seguimiento
    // 3. Enviar notificación al admin

    // Por ahora, registrar en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Nuevo mensaje de contacto:');
      console.log(`De: ${sanitizedName} <${sanitizedEmail}>`);
      console.log(`Asunto: ${sanitizedSubject}`);
      console.log(`Mensaje: ${sanitizedMessage}`);
    }

    // En producción, aquí se enviaría el email
    // Por ahora, simulamos éxito

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
