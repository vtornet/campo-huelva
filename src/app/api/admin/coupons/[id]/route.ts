import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";

// PUT - Actualizar cupón (aprobar solicitud, revocar, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    // Si es una solicitud pendiente y se aprueba
    if (coupon.notes?.startsWith("REQUEST:") && action === "approve") {
      // Extraer companyId de las notas
      const parts = coupon.notes.substring(9).split("|");
      const requestCompanyId = parts[0];

      // Obtener datos de la empresa para enviar el email
      const company = await prisma.companyProfile.findUnique({
        where: { id: requestCompanyId },
        include: { user: { select: { email: true } } },
      });

      console.log("[APPROVE COUPON] Company data:", {
        requestCompanyId,
        companyFound: !!company,
        companyName: company?.companyName,
        userFound: !!company?.user,
        userEmail: company?.user?.email,
      });

      // Aprobar: marcar como activo y limpiar notas
      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          status: "ACTIVE",
          notes: `Aprobado por ${userId}. Razón: ${parts[1] || ''}`,
        },
      });

      // Enviar email al usuario con el código
      if (resend && company?.user?.email) {
        try {
          console.log("[APPROVE COUPON] Sending email to:", company.user.email);
          const result = await resend.emails.send({
            from: FROM_EMAIL,
            to: company.user.email,
            subject: "¡Tu cupón de Agro Red ha sido aprobado!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">🎉 ¡Buenas noticias!</h1>
                </div>
                <div style="padding: 30px; background-color: #f9fafb;">
                  <p style="font-size: 16px; color: #374151;">Hola ${company.companyName},</p>
                  <p style="font-size: 16px; color: #374151;">Tu solicitud de cupón ha sido aprobada. Ya puedes publicar tu primera oferta en Agro Red.</p>

                  <div style="background: white; border: 2px dashed #047857; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Tu código de cupón:</p>
                    <p style="margin: 0; font-size: 32px; font-weight: bold; color: #047857; letter-spacing: 2px;">${coupon.code}</p>
                  </div>

                  <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #065f46;">¿Cómo usar tu cupón?</h3>
                    <ol style="margin: 0; padding-left: 20px; color: #374151;">
                      <li>Ve a "Publicar oferta" desde tu perfil</li>
                      <li>Completa los datos de la oferta</li>
                      <li>Introduce el código del cupón en el campo "Cupón de descuento"</li>
                      <li>¡Publica tu oferta completamente gratis!</li>
                    </ol>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://agroredjob.com'}/publish" style="background: #047857; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Publicar mi oferta ahora
                    </a>
                  </div>

                  <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 30px 0 0 0;">
                    Este cupón es válido por 30 días. Si tienes alguna duda, contáctanos en contact@appstracta.app
                  </p>
                </div>
                <div style="background: #1f2937; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2026 Agro Red. Todos los derechos reservados.</p>
                </div>
              </div>
            `,
          });
          console.log("[APPROVE COUPON] Email sent successfully:", result);
        } catch (emailError) {
          console.error("[APPROVE COUPON] Error sending email:", emailError);
        }
      } else {
        console.log("[APPROVE COUPON] Email not sent. Resend available:", !!resend, "Email:", company?.user?.email);
      }

      return NextResponse.json({
        success: true,
        coupon: updated,
        message: company?.user?.email
          ? `Solicitud aprobada. Email enviado a ${company.user.email}`
          : "Solicitud aprobada",
      });
    }

    // Otras acciones
    switch (action) {
      case "revoke":
        await prisma.coupon.update({
          where: { id },
          data: { status: "REVOKED" },
        });
        return NextResponse.json({ success: true, message: "Cupón revocado" });

      case "reactivate":
        await prisma.coupon.update({
          where: { id },
          data: { status: "ACTIVE" },
        });
        return NextResponse.json({ success: true, message: "Cupón reactivado" });

      case "extend":
        const { days } = body;
        await prisma.coupon.update({
          where: { id },
          data: {
            expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: `Cupón extendido ${days} días` });

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Error al actualizar cupón" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cupón
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Cupón eliminado" });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Error al eliminar cupón" },
      { status: 500 }
    );
  }
}
