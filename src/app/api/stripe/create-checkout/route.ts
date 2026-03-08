import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { createCheckoutSession, PREMIUM_PRICE_ID } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY no está configurada en Railway");
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

    if (!PREMIUM_PRICE_ID) {
      console.error("STRIPE_PREMIUM_PRICE_ID no está configurada");
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "ID de precio no configurado" },
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

    // Verificar que el usuario sea una empresa
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

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.role !== Role.COMPANY) {
      return NextResponse.json(
        { error: "Solo las empresas pueden suscribirse al plan Premium" },
        { status: 403 }
      );
    }

    if (!user.companyProfile) {
      return NextResponse.json(
        { error: "Debes completar tu perfil de empresa primero" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene una suscripción activa
    if (user.companyProfile.subscription) {
      const sub = user.companyProfile.subscription;
      if (
        sub.status === "ACTIVE" ||
        sub.status === "TRIALING" ||
        (sub.status === "CANCELED" &&
          sub.currentPeriodEnd &&
          new Date(sub.currentPeriodEnd) > new Date())
      ) {
        return NextResponse.json(
          {
            error: "Ya tienes una suscripción activa",
            subscription: {
              status: sub.status,
              trialEndsAt: sub.trialEndsAt,
              currentPeriodEnd: sub.currentPeriodEnd,
            },
          },
          { status: 400 }
        );
      }
    }

    // Obtener URLs de redirección
    // Usar NEXT_PUBLIC_APP_URL si está disponible, si no usar el origin de la petición
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const successUrl = `${baseUrl}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/premium?canceled=true`;

    // Crear sesión de checkout
    const checkoutSession = await createCheckoutSession(
      userId,
      user.email,
      user.companyProfile.id,
      successUrl,
      cancelUrl
    );

    return NextResponse.json(checkoutSession);
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    // Mensaje de error más detallado
    const errorMessage = error?.message || error?.toString() || "Error desconocido";
    console.error("Error details:", errorMessage);

    return NextResponse.json(
      { error: "Error al crear la sesión de pago", details: errorMessage },
      { status: 500 }
    );
  }
}
