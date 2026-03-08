import { NextResponse } from "next/server";

// Clave pública de Stripe (safe para exponer)
export async function GET() {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  // Devolvemos la configuración aunque no haya clave Stripe
  // Esto permite que la página se muestre correctamente
  return NextResponse.json({
    publishableKey: publishableKey || null,
    stripeEnabled: !!publishableKey,
    // Información del plan premium para mostrar en el frontend
    premium: {
      name: "Plan Premium Empresa",
      priceMonthly: 99,
      priceYearly: 999,
      trialDays: 7,
    },
  });
}
