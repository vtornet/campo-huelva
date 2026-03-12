import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createCustomerPortalSession, getStripe } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está configurada");
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

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
        { error: "No se encontró el cliente de Stripe. La suscripción puede no estar completamente configurada." },
        { status: 400 }
      );
    }

    // Crear URL del portal
    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/profile?tab=suscripcion`;

    const portalSession = await createCustomerPortalSession(
      stripeCustomerId,
      returnUrl
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Error creating portal session:", error);

    // Manejo específico de errores de Stripe
    const errorMessage = error?.message || error?.toString() || "Error desconocido";
    console.error("Error details:", errorMessage);

    // Verificar si es un error de configuración de Stripe
    if (errorMessage.includes("STRIPE_SECRET_KEY") || errorMessage.includes("getStripe")) {
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear sesión del portal", details: errorMessage },
      { status: 500 }
    );
  }
}
