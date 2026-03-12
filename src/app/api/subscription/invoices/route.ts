import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
      );
    }

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

    if (!user?.companyProfile) {
      return NextResponse.json(
        { error: "Perfil de empresa no encontrado" },
        { status: 404 }
      );
    }

    const subscription = user.companyProfile.subscription;

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json({
        hasInvoices: false,
        invoices: [],
        message: "No hay suscripción con facturas para mostrar",
      });
    }

    console.log("[INVOICES] Obteniendo facturas para customer:", subscription.stripeCustomerId);

    // Obtener facturas desde Stripe
    const stripeInstance = getStripe();
    const invoices = await stripeInstance.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 25, // Últimas 25 facturas
    });

    console.log("[INVOICES] Facturas recuperadas:", invoices.data.length);

    // Formatear facturas para la respuesta
    const formattedInvoices = invoices.data.map((invoice: any) => ({
      id: invoice.id,
      number: invoice.number,
      amountPaid: invoice.amount_paid / 100, // Convertir de centimos a euros
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      created: new Date(invoice.created * 1000).toISOString(),
      dueDate: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      isPaid: invoice.status === "paid",
      description: invoice.description,
    }));

    return NextResponse.json({
      hasInvoices: true,
      invoices: formattedInvoices,
    });
  } catch (error: any) {
    console.error("[INVOICES] Error obteniendo facturas:", error);

    // Si el error es de autenticación
    if (error.message?.includes("Unauthorized") || error.message?.includes("inválido")) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener facturas", details: error?.message },
      { status: 500 }
    );
  }
}
