import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { createOfferCheckoutSession, OFFER_PRICE_ID_1 } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Verificar que los price IDs estén configurados
    if (!OFFER_PRICE_ID_1) {
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { uid, offerPack = '1' } = body;

    if (!uid) {
      return NextResponse.json(
        { error: "No se proporcionó uid" },
        { status: 400 }
      );
    }

    if (!['1', '5', '10'].includes(offerPack)) {
      return NextResponse.json(
        { error: "Pack de ofertas no válido" },
        { status: 400 }
      );
    }

    // Verificar que el usuario sea una empresa
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { companyProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.role !== Role.COMPANY) {
      return NextResponse.json(
        { error: "Solo las empresas pueden comprar packs de ofertas" },
        { status: 403 }
      );
    }

    if (!user.companyProfile) {
      return NextResponse.json(
        { error: "Debes completar tu perfil de empresa primero" },
        { status: 400 }
      );
    }

    // Obtener URLs de redirección
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const successUrl = `${baseUrl}/publish?pack_purchased=${offerPack}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/premium?canceled=true`;

    // Crear sesión de checkout
    const checkoutSession = await createOfferCheckoutSession(
      uid,
      user.email,
      user.companyProfile.id,
      successUrl,
      cancelUrl,
      offerPack as '1' | '5' | '10'
    );

    return NextResponse.json(checkoutSession);
  } catch (error: any) {
    console.error("Error creating offer checkout session:", error);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago", details: error?.message },
      { status: 500 }
    );
  }
}
