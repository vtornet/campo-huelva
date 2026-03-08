import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { PrismaClient, SubscriptionStatus, SubscriptionAction } from "@prisma/client";
import { getStripe } from "@/lib/stripe";

const prisma = new PrismaClient();

// Tipos de eventos de Stripe que manejamos
const relevantEvents = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET no configurado");
    return NextResponse.json(
      { error: "Webhook no configurado" },
      { status: 500 }
    );
  }

  let event;
  try {
    const stripeInstance = getStripe();
    event = stripeInstance.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Error verifying webhook signature:", err.message);
    return NextResponse.json(
      { error: "Firma inválida" },
      { status: 400 }
    );
  }

  // Verificar que el evento es relevante
  if (!relevantEvents.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        await handleSubscriptionCreated(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as any;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

// Manejar checkout completado
async function handleCheckoutCompleted(session: any) {
  const { userId, companyId } = session.metadata;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!userId || !companyId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // Obtener detalles de la suscripción
  const stripeInstance = getStripe();
  const subscriptionResponse = await stripeInstance.subscriptions.retrieve(subscriptionId);
  const subscription = subscriptionResponse as any;

  // Determinar si está en periodo de prueba
  const hasTrial = Boolean(subscription.trial_end && subscription.trial_end > Date.now() / 1000);

  // Crear o actualizar registro de suscripción
  await prisma.subscription.upsert({
    where: { companyId },
    create: {
      companyId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0].price.id,
      status: mapStripeStatus(subscription.status),
      isTrial: hasTrial,
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      history: {
        create: {
          action: SubscriptionAction.CREATED,
          toStatus: mapStripeStatus(subscription.status),
          metadata: { stripeEventId: session.id },
          changeReason: "Checkout completado",
        },
      },
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

// Manejar suscripción creada
async function handleSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer as string;

  // Buscar la suscripción por customerId
  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!existing) {
    // La suscripción se creará en checkout.session.completed
    return;
  }

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

// Manejar suscripción actualizada
async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer as string;

  const existing = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!existing) {
    return;
  }

  const newStatus = mapStripeStatus(subscription.status);

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: newStatus,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Añadir al historial si hubo cambio de estado
  if (existing.status !== newStatus) {
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: existing.id,
        action: SubscriptionAction.UPDATED, // Este enum no existe, lo arreglaré
        fromStatus: existing.status,
        toStatus: newStatus,
        changeReason: "Stripe subscription updated",
      },
    });
  }
}

// Manejar suscripción cancelada
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer as string;

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: SubscriptionStatus.CANCELED,
      cancelAtPeriodEnd: true,
    },
  });
}

// Manejar factura pagada
async function handleInvoicePaid(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  const customerId = invoice.customer as string;

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existing) {
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date(invoice.period_end * 1000),
    },
  });
}

// Manejar fallo de pago
async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;

  const existing = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existing) {
    return;
  }

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      status: SubscriptionStatus.PAST_DUE,
    },
  });
}

// Mapear status de Stripe a nuestro enum
function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "incomplete_expired":
      return SubscriptionStatus.INCOMPLETE_EXPIRED;
    case "paused":
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.ACTIVE;
  }
}
