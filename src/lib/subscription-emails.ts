import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";

interface InvoiceEmailData {
  email: string;
  companyName: string;
  amount: number;
  currency: string;
  periodEnd: string;
  invoiceUrl: string;
  isRenewal: boolean;
}

function createInvoicePaidEmailHtml(data: InvoiceEmailData): string {
  const { email, companyName, amount, currency, periodEnd, invoiceUrl, isRenewal } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de pago - Agro Red</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
    <h1 style="color: white; margin: 0; font-size: 24px;">Agro Red Premium</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${companyName}</p>
  </div>

  <!-- Content -->
  <div style="background: #f9fafb; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0; color: #1f2937;">${isRenewal ? '¡Tu suscripción ha sido renovada!' : '¡Pago completado con éxito!'}</h2>

    <p style="color: #4b5563; margin-bottom: 20px;">
      ${isRenewal
        ? 'Se ha procesado correctamente la renovación de tu suscripción Premium en <strong>Agro Red</strong>.'
        : 'Se ha procesado correctamente el pago de tu suscripción Premium en <strong>Agro Red</strong>.'
      }
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af; margin-bottom: 25px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Importe cobrado:</p>
      <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 24px; font-weight: 700;">${amount.toFixed(2)} ${currency.toUpperCase()}</p>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Próxima renovación:</p>
      <p style="margin: 5px 0 0 0; color: #1f2937; font-weight: 500;">${periodEnd}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invoiceUrl}"
         style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        📄 Ver factura
      </a>
    </div>

    <h3 style="color: #1f2937; margin-bottom: 15px;">✅ Tus beneficios Premium</h3>
    <ul style="color: #4b5563; padding-left: 20px; margin: 0;">
      <li style="margin-bottom: 8px;">Publicación de ofertas ilimitadas</li>
      <li style="margin-bottom: 8px;">Acceso completo al buscador de candidatos</li>
      <li style="margin-bottom: 8px;">Badge "Empresa Premium" en tu perfil</li>
      <li style="margin-bottom: 8px;">Prioridad en resultados de búsqueda</li>
      <li style="margin-bottom: 0;">Soporte prioritario</li>
    </ul>
  </div>

  <!-- Footer -->
  <div style="background: #1f2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">¿Tienes preguntas? Contáctanos en support@agroredjob.com</p>
    <p style="margin: 5px 0 0 0;">© 2026 Agro Red - agroredjob.com</p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendInvoicePaidEmail(data: InvoiceEmailData): Promise<boolean> {
  if (!resend) {
    console.log("[INVOICE-EMAIL] Resend no configurado, omitiendo envío de email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: `💳 Pago completado - Agro Red Premium - ${data.amount.toFixed(2)} ${data.currency.toUpperCase()}`,
      html: createInvoicePaidEmailHtml(data),
      tags: [
        { name: 'type', value: 'invoice_paid' },
        { name: 'subscription', value: 'premium' }
      ],
    });

    if (!error) {
      console.log(`[INVOICE-EMAIL] Email enviado a ${data.email} por pago de ${data.amount} ${data.currency}`);
      return true;
    } else {
      console.error("[INVOICE-EMAIL] Error al enviar email:", error);
      return false;
    }
  } catch (emailErr: any) {
    console.error("[INVOICE-EMAIL] Excepción al enviar email:", emailErr);
    return false;
  }
}

interface TrialEndingEmailData {
  email: string;
  companyName: string;
  trialEndsAt: string;
  skipTrialUrl: string;
}

function createTrialEndingEmailHtml(data: TrialEndingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu periodo de prueba finaliza pronto - Agro Red</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <div style="font-size: 48px; margin-bottom: 10px;">⏰</div>
    <h1 style="color: white; margin: 0; font-size: 24px;">Agro Red Premium</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${data.companyName}</p>
  </div>

  <div style="background: #f9fafb; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="margin-top: 0; color: #1f2937;">Tu periodo de prueba finaliza pronto</h2>

    <p style="color: #4b5563; margin-bottom: 20px;">
      Tu periodo de prueba de Agro Red Premium finalizará el <strong>${data.trialEndsAt}</strong>.
    </p>

    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <p style="margin: 0; color: #92400e;">
        <strong>⚠️ Importante:</strong> Si no suscribes antes de esa fecha, perderás acceso al buscador de candidatos y otros beneficios Premium.
      </p>
    </div>

    <p style="color: #4b5563; margin-bottom: 10px;">¿Quieres continuar disfrutando de Premium?</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.skipTrialUrl}"
         style="display: inline-block; background: #1e40af; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Suscribirse ahora - 99€/mes
      </a>
    </div>
  </div>

  <div style="background: #1f2937; color: rgba(255,255,255,0.7); padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px;">
    <p style="margin: 0;">¿Tienes preguntas? Contáctanos en support@agroredjob.com</p>
    <p style="margin: 5px 0 0 0;">© 2026 Agro Red - agroredjob.com</p>
  </div>
</body>
</html>
  `.trim();
}

export async function sendTrialEndingEmail(data: TrialEndingEmailData): Promise<boolean> {
  if (!resend) {
    console.log("[TRIAL-EMAIL] Resend no configurado, omitiendo envío de email");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: "⏰ Tu periodo de prueba finaliza pronto - Agro Red Premium",
      html: createTrialEndingEmailHtml(data),
      tags: [
        { name: 'type', value: 'trial_ending' },
        { name: 'subscription', value: 'premium' }
      ],
    });

    if (!error) {
      console.log(`[TRIAL-EMAIL] Email enviado a ${data.email} sobre fin de trial`);
      return true;
    } else {
      console.error("[TRIAL-EMAIL] Error al enviar email:", error);
      return false;
    }
  } catch (emailErr: any) {
    console.error("[TRIAL-EMAIL] Excepción al enviar email:", emailErr);
    return false;
  }
}
