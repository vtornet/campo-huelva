import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com";

// PUT - Aprobar o rechazar solicitud de prueba
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

    const trial = await prisma.freeTrialRequest.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!trial) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (action === "approve") {
      // Generar token único
      const token = randomUUID();

      // Actualizar solicitud
      const updated = await prisma.freeTrialRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          token,
          approvedAt: new Date(),
        },
      });

      // Enviar email a la empresa
      if (resend && trial.company?.user?.email) {
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: trial.company.user.email,
            subject: "¡Tu prueba gratuita está lista en Agro Red!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0;">🎉 ¡Buenas noticias!</h1>
                </div>
                <div style="padding: 30px; background-color: #f9fafb;">
                  <p style="font-size: 16px; color: #374151;">Hola ${trial.company.companyName},</p>
                  <p style="font-size: 16px; color: #374151;">Tu solicitud de prueba gratuita ha sido aprobada. Ya puedes publicar tu primera oferta en Agro Red.</p>

                  <div style="background: white; border: 2px dashed #047857; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">Tu enlace de publicación:</p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #047857; word-break: break-all;">${APP_URL}/publish?trialToken=${token}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${APP_URL}/publish?trialToken=${token}" style="background: #047857; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Publicar mi oferta ahora
                    </a>
                  </div>

                  <p style="font-size: 14px; color: #6b7280; text-align: center; margin: 30px 0 0 0;">
                    Este enlace es válido para una sola publicación. Si tienes alguna duda, contáctanos en contact@appstracta.app
                  </p>
                </div>
                <div style="background: #1f2937; padding: 20px; text-align: center;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2026 Agro Red. Todos los derechos reservados.</p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Error enviando email de aprobación:", emailError);
        }
      }

      return NextResponse.json({
        success: true,
        trial: updated,
        message: trial.company?.user?.email
          ? `Solicitud aprobada. Email enviado a ${trial.company.user.email}`
          : "Solicitud aprobada",
      });
    }

    if (action === "reject") {
      await prisma.freeTrialRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ success: true, message: "Solicitud rechazada" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating trial:", error);
    return NextResponse.json({ error: "Error al actualizar solicitud" }, { status: 500 });
  }
}

// DELETE - Eliminar solicitud
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

    await prisma.freeTrialRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Solicitud eliminada" });
  } catch (error: any) {
    console.error("Error deleting trial:", error);
    return NextResponse.json({ error: "Error al eliminar solicitud" }, { status: 500 });
  }
}
