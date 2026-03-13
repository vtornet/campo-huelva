import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Agro Red <onboarding@resend.dev>";

export async function POST(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener datos del formulario
    const body = await request.json();
    const { reason, companySize } = body;

    if (!reason || reason.trim().length < 20) {
      return NextResponse.json(
        { error: "Por favor, explica por qué quieres probar Agro Red (mínimo 20 caracteres)" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es una empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || user.role !== Role.COMPANY) {
      return NextResponse.json(
        { error: "Los cupones son solo para empresas" },
        { status: 403 }
      );
    }

    if (!user.companyProfile) {
      return NextResponse.json(
        { error: "Debes completar tu perfil de empresa primero" },
        { status: 400 }
      );
    }

    // Verificar si ya ha usado un cupón
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        usedBy: user.companyProfile.id,
        status: "USED",
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Ya has utilizado tu cupón de oferta gratis" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene una solicitud pendiente
    const pendingRequest = await prisma.coupon.findFirst({
      where: {
        status: "ACTIVE",
        notes: { contains: user.companyProfile.id },
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        { error: "Ya tienes una solicitud de cupón pendiente" },
        { status: 400 }
      );
    }

    // Generar código único
    const code = `AGRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Crear cupón pendiente (marcado con email y companyId en notes para identificación)
    console.log("[COUPON REQUEST] User email:", user.email, "userId:", userId);
    const coupon = await prisma.coupon.create({
      data: {
        code,
        status: "ACTIVE",
        maxUses: 1,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        notes: `REQUEST:${user.email}|${user.companyProfile.id}|${user.companyProfile.companyName}|${reason.substring(0, 100)}`,
      },
    });
    console.log("[COUPON REQUEST] Saved notes:", coupon.notes);

    // Enviar email al admin con la solicitud
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ["contact@appstracta.app"], // Email del admin
          subject: `Solicitud de cupón - ${user.companyProfile.companyName}`,
          html: `
            <h2>Nueva solicitud de cupón</h2>
            <p><strong>Empresa:</strong> ${user.companyProfile.companyName}</p>
            <p><strong>CIF:</strong> ${user.companyProfile.cif}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Tamaño:</strong> ${companySize || 'No especificado'}</p>
            <p><strong>Razón:</strong> ${reason}</p>
            <p><strong>ID Empresa:</strong> ${user.companyProfile.id}</p>
            <p><strong>ID Usuario:</strong> ${userId}</p>
            <hr>
            <p>Para aprobar, usa el código: <strong>${code}</strong></p>
            <p>O visita el panel de admin para gestionar esta solicitud.</p>
          `,
        });
      } catch (emailError) {
        console.error("Error enviando email de solicitud:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada. Recibirás un email cuando sea aprobada.",
      couponId: coupon.id,
    });
  } catch (error: any) {
    console.error("Error requesting coupon:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
