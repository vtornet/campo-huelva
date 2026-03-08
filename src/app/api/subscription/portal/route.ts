import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createCustomerPortalSession } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Obtener userId del body
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "No se proporcionó uid" },
        { status: 400 }
      );
    }

    const userId = uid;

    // Obtener datos de la empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyProfile: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user?.companyProfile?.subscription) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa" },
        { status: 400 }
      );
    }

    const { stripeCustomerId } = user.companyProfile.subscription;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No se encontró el cliente de Stripe" },
        { status: 400 }
      );
    }

    // Crear URL del portal
    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/profile`;

    const portalSession = await createCustomerPortalSession(
      stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return NextResponse.json(
      { error: "Error al crear sesión del portal" },
      { status: 500 }
    );
  }
}
