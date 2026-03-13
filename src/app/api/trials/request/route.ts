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
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del formulario
    const body = await request.json();
    const { companySize } = body;

    // Verificar que el usuario es una empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || user.role !== Role.COMPANY) {
      return NextResponse.json({ error: "La prueba gratuita es solo para empresas" }, { status: 403 });
    }

    if (!user.companyProfile) {
      return NextResponse.json({ error: "Debes completar tu perfil de empresa primero" }, { status: 400 });
    }

    // Verificar si ya tiene una solicitud pendiente o aprobada
    const existingRequest = await prisma.freeTrialRequest.findFirst({
      where: {
        companyId: user.companyProfile.id,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === "PENDING") {
        return NextResponse.json({ error: "Ya tienes una solicitud pendiente de revisión" }, { status: 400 });
      }
      if (existingRequest.status === "APPROVED") {
        return NextResponse.json({ error: "Ya has recibido una prueba gratuita anteriormente" }, { status: 400 });
      }
    }

    // Verificar si usó una prueba anterior (está en USED)
    const usedRequest = await prisma.freeTrialRequest.findFirst({
      where: {
        companyId: user.companyProfile.id,
        status: "USED",
      },
    });

    if (usedRequest) {
      return NextResponse.json({ error: "Ya has utilizado tu prueba gratuita anteriormente" }, { status: 400 });
    }

    // Crear solicitud de prueba gratuita
    const trialRequest = await prisma.freeTrialRequest.create({
      data: {
        companyId: user.companyProfile.id,
        companySize: companySize || "No especificado",
        status: "PENDING",
      },
    });

    // Enviar email al admin con la solicitud
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: ["contact@appstracta.app"],
          subject: `Solicitud de prueba gratuita - ${user.companyProfile.companyName}`,
          html: `
            <h2>Nueva solicitud de prueba gratuita</h2>
            <p><strong>Empresa:</strong> ${user.companyProfile.companyName}</p>
            <p><strong>CIF:</strong> ${user.companyProfile.cif}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Volumen trabajadores:</strong> ${companySize || "No especificado"}</p>
            <p><strong>ID Empresa:</strong> ${user.companyProfile.id}</p>
            <hr>
            <p>Para aprobar, visita el panel de admin y ve a "Pruebas gratuitas".</p>
          `,
        });
      } catch (emailError) {
        console.error("Error enviando email de solicitud:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada. Recibirás un email cuando sea aprobada.",
    });
  } catch (error: any) {
    console.error("Error requesting trial:", error);
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 });
  }
}
