import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createCustomerPortalSession, getStripe } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("[PORTAL] Iniciando petición del portal de gestión");

    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[PORTAL] STRIPE_SECRET_KEY no está configurada");
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

    // Obtener userId del body
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      console.error("[PORTAL] No se proporcionó uid");
      return NextResponse.json(
        { error: "No se proporcionó uid" },
        { status: 400 }
      );
    }

    console.log("[PORTAL] Obteniendo datos del usuario:", uid);

    // Obtener datos de la empresa
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        companyProfile: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      console.error("[PORTAL] Usuario no encontrado");
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (!user.companyProfile) {
      console.error("[PORTAL] Perfil de empresa no encontrado");
      return NextResponse.json(
        { error: "Perfil de empresa no encontrado" },
        { status: 400 }
      );
    }

    if (!user.companyProfile.subscription) {
      console.error("[PORTAL] Suscripción no encontrada");
      return NextResponse.json(
        { error: "No tienes una suscripción activa" },
        { status: 400 }
      );
    }

    const { stripeCustomerId, stripeSubscriptionId, status } = user.companyProfile.subscription;

    console.log("[PORTAL] Datos de suscripción:", {
      status,
      hasStripeCustomerId: !!stripeCustomerId,
      hasStripeSubscriptionId: !!stripeSubscriptionId,
      stripeCustomerId: stripeCustomerId?.substring(0, 10) + "...",
    });

    if (!stripeCustomerId) {
      console.error("[PORTAL] No se encontró el cliente de Stripe");
      return NextResponse.json(
        {
          error: "NO_STRIPE_CUSTOMER",
          message: "La suscripción no tiene un cliente de Stripe asociado. Esto puede ocurrir si la suscripción se creó manualmente o el pago aún no se ha procesado."
        },
        { status: 400 }
      );
    }

    // Crear URL del portal
    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/profile?tab=suscripcion`;

    console.log("[PORTAL] Creando sesión del portal con returnUrl:", returnUrl);

    const portalSession = await createCustomerPortalSession(
      stripeCustomerId,
      returnUrl
    );

    console.log("[PORTAL] Sesión del portal creada correctamente");
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[PORTAL] Error creating portal session:", error);

    // Manejo específico de errores de Stripe
    const errorMessage = error?.message || error?.toString() || "Error desconocido";
    console.error("[PORTAL] Error details:", errorMessage);
    console.error("[PORTAL] Error stack:", error?.stack);

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
