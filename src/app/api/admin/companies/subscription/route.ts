import { NextResponse } from "next/server";
import { PrismaClient, SubscriptionStatus, SubscriptionAction } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Crear o actualizar suscripción manualmente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, action, months, userId } = body;

    if (!companyId || !action || !userId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Verificar que el usuario es admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar que la empresa existe
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
      include: { subscription: true }
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    const now = new Date();

    switch (action) {
      case "activate": {
        // Activar suscripción premium por X meses (sin trial)
        const monthsToAdd = months || 1;
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + monthsToAdd);

        let subscription;

        if (company.subscription) {
          // Actualizar suscripción existente
          subscription = await prisma.subscription.update({
            where: { id: company.subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
              isTrial: false,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
            }
          });

          // Registrar historial
          await prisma.subscriptionHistory.create({
            data: {
              subscriptionId: subscription.id,
              action: SubscriptionAction.PAYMENT_SUCCEEDED,
              fromStatus: company.subscription.status,
              toStatus: SubscriptionStatus.ACTIVE,
              changedBy: userId,
              changeReason: "Activación manual por admin",
              metadata: { months: monthsToAdd }
            }
          });
        } else {
          // Crear nueva suscripción
          subscription = await prisma.subscription.create({
            data: {
              companyId: company.id,
              status: SubscriptionStatus.ACTIVE,
              isTrial: false,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              trialUsed: true, // Marcar como que ya usó su prueba
            }
          });

          // Registrar historial
          await prisma.subscriptionHistory.create({
            data: {
              subscriptionId: subscription.id,
              action: SubscriptionAction.CREATED,
              toStatus: SubscriptionStatus.ACTIVE,
              changedBy: userId,
              changeReason: "Creación manual por admin",
              metadata: { months: monthsToAdd }
            }
          });
        }

        return NextResponse.json({
          success: true,
          message: `Suscripción premium activada por ${monthsToAdd} mes(es)`,
          subscription
        });
      }

      case "revoke": {
        // Revocar suscripción premium inmediatamente
        if (!company.subscription) {
          return NextResponse.json({ error: "La empresa no tiene suscripción" }, { status: 400 });
        }

        const oldStatus = company.subscription.status;

        // Si hay suscripción en Stripe, cancelarla también
        if (company.subscription.stripeSubscriptionId) {
          try {
            const { getStripe } = await import("@/lib/stripe");
            const stripe = getStripe();
            // Cancelar inmediatamente en Stripe (no al final del periodo)
            await stripe.subscriptions.cancel(company.subscription.stripeSubscriptionId);
          } catch (stripeError) {
            console.error("Error cancelando en Stripe, continuando con cancelación local:", stripeError);
          }
        }

        // Establecer currentPeriodEnd en el pasado para quitar acceso inmediatamente
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await prisma.subscription.update({
          where: { id: company.subscription.id },
          data: {
            status: SubscriptionStatus.CANCELED,
            cancelAtPeriodEnd: true,
            currentPeriodEnd: yesterday, // Clave: terminar el periodo ayer
            // Limpiar el ID de Stripe para que no se sincronice más
            stripeSubscriptionId: null,
          }
        });

        // Registrar historial
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: company.subscription.id,
            action: SubscriptionAction.CANCELED,
            fromStatus: oldStatus,
            toStatus: SubscriptionStatus.CANCELED,
            changedBy: userId,
            changeReason: "Revocación inmediata por admin (acceso Premium terminado)"
          }
        });

        return NextResponse.json({
          success: true,
          message: "Suscripción revocada inmediatamente. La empresa ya no tiene acceso a Premium."
        });
      }

      case "force_revoke": {
        // Forzar revocación para casos donde la suscripción local está CANCELED
        // pero sigue activa en Stripe
        if (!company.subscription) {
          return NextResponse.json({ error: "La empresa no tiene suscripción" }, { status: 400 });
        }

        // Solo proceder si hay ID de Stripe pero el estado local no es ACTIVE
        if (!company.subscription.stripeSubscriptionId) {
          return NextResponse.json({ error: "No hay suscripción en Stripe para cancelar" }, { status: 400 });
        }

        try {
          const { getStripe } = await import("@/lib/stripe");
          const stripe = getStripe();
          // Cancelar en Stripe
          await stripe.subscriptions.cancel(company.subscription.stripeSubscriptionId);

          // Actualizar BD para quitar el ID de Stripe
          await prisma.subscription.update({
            where: { id: company.subscription.id },
            data: {
              stripeSubscriptionId: null,
            }
          });

          return NextResponse.json({
            success: true,
            message: "Suscripción cancelada en Stripe. El estado local ya era CANCELED."
          });
        } catch (stripeError: any) {
          console.error("Error en force_revoke:", stripeError);
          return NextResponse.json({
            error: "Error al cancelar en Stripe",
            details: stripeError?.message
          }, { status: 500 });
        }
      }

      case "extend": {
        // Extender suscripción existente
        if (!company.subscription) {
          return NextResponse.json({ error: "La empresa no tiene suscripción" }, { status: 400 });
        }

        const monthsToAdd = months || 1;
        const currentEnd = company.subscription.currentPeriodEnd || now;
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + monthsToAdd);

        const subscription = await prisma.subscription.update({
          where: { id: company.subscription.id },
          data: {
            currentPeriodEnd: newEnd,
            status: SubscriptionStatus.ACTIVE,
            cancelAtPeriodEnd: false,
          }
        });

        // Registrar historial
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: subscription.id,
            action: SubscriptionAction.RENEWED,
            fromStatus: company.subscription.status,
            toStatus: SubscriptionStatus.ACTIVE,
            changedBy: userId,
            changeReason: "Extensión manual por admin",
            metadata: { months: monthsToAdd, previousEnd: currentEnd, newEnd }
          }
        });

        return NextResponse.json({
          success: true,
          message: `Suscripción extendida ${monthsToAdd} mes(es). Nueva fecha de fin: ${newEnd.toLocaleDateString()}`,
          subscription
        });
      }

      case "schedule_cancel": {
        // Programar cancelación al final del periodo (no inmediata)
        if (!company.subscription) {
          return NextResponse.json({ error: "La empresa no tiene suscripción" }, { status: 400 });
        }

        const oldStatus = company.subscription.status;

        // Si hay suscripción en Stripe, actualizarla también
        if (company.subscription.stripeSubscriptionId) {
          try {
            const { getStripe } = await import("@/lib/stripe");
            const stripe = getStripe();
            await stripe.subscriptions.update(company.subscription.stripeSubscriptionId, {
              cancel_at_period_end: true,
            });
          } catch (stripeError) {
            console.error("Error programando cancelación en Stripe, continuando con cancelación local:", stripeError);
          }
        }

        await prisma.subscription.update({
          where: { id: company.subscription.id },
          data: {
            cancelAtPeriodEnd: true,
          }
        });

        // Registrar historial
        await prisma.subscriptionHistory.create({
          data: {
            subscriptionId: company.subscription.id,
            action: SubscriptionAction.CANCELED,
            fromStatus: oldStatus,
            toStatus: company.subscription.status, // Mantener ACTIVE
            changedBy: userId,
            changeReason: "Cancelación programada por admin (al fin del periodo)"
          }
        });

        const endDate = company.subscription.currentPeriodEnd
          ? new Date(company.subscription.currentPeriodEnd).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
          : "fin del periodo";

        return NextResponse.json({
          success: true,
          message: `Suscripción se cancelará el ${endDate}. La empresa mantendrá Premium hasta entonces.`
        });
      }

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error managing subscription:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
