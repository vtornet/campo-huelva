import Stripe from 'stripe';

// Obtener la clave secreta de Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Inicializar Stripe con la clave secreta (lazy initialization)
export const getStripe = () => {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY no está configurada');
  }
  return new Stripe(STRIPE_SECRET_KEY, {
    typescript: true,
  });
};

// Para compatibilidad con código existente
export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null;

// ID del precio de la suscripción premium (configurado en Stripe Dashboard)
export const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || '';

// Configuración del plan premium
export const PREMIUM_CONFIG = {
  name: 'Plan Premium Empresa',
  priceMonthly: 99, // EUR
  priceYearly: 999, // EUR (2 meses gratis)
  trialDays: 7,
  features: [
    'Publicación de ofertas ilimitadas',
    'Acceso completo al buscador de candidatos',
    'Badge "Empresa Premium" en tu perfil',
    'Prioridad en resultados de búsqueda',
    'Soporte prioritario',
  ],
};

// Crear una sesión de checkout para una suscripción
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  companyId: string,
  successUrl: string,
  cancelUrl: string,
  skipTrial: boolean = false
) {
  try {
    const stripeInstance = getStripe();

    // Construir datos de la suscripción
    const subscriptionData: any = {
      metadata: {
        userId,
        companyId,
        skipTrial: skipTrial.toString(),
      },
    };

    // Solo añadir trial_period_days si no se quiere saltar el trial
    if (!skipTrial) {
      subscriptionData.trial_period_days = PREMIUM_CONFIG.trialDays;
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: PREMIUM_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        companyId,
        skipTrial: skipTrial.toString(),
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Crear un portal de gestión de suscripciones
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    const stripeInstance = getStripe();
    const session = await stripeInstance.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

// Verificar el estado de una suscripción
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const stripeInstance = getStripe();
    const subscriptionResponse = await stripeInstance.subscriptions.retrieve(subscriptionId);
    const subscription = subscriptionResponse as any;
    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw error;
  }
}

// Cancelar una suscripción
export async function cancelSubscription(subscriptionId: string) {
  try {
    const stripeInstance = getStripe();
    const subscriptionResponse = await stripeInstance.subscriptions.cancel(subscriptionId);
    const subscription = subscriptionResponse as any;
    return {
      status: subscription.status,
      canceledAt: subscription.canceled_at,
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}
