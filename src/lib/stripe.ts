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
export const PREMIUM_PRICE_ID_YEARLY = process.env.STRIPE_PREMIUM_PRICE_ID_YEARLY || '';

// ID de precios para publicación de ofertas individuales (payment)
export const OFFER_PRICE_ID_1 = process.env.STRIPE_OFFER_PRICE_ID_1 || '';
export const OFFER_PRICE_ID_5 = process.env.STRIPE_OFFER_PRICE_ID_5 || '';
export const OFFER_PRICE_ID_10 = process.env.STRIPE_OFFER_PRICE_ID_10 || '';

// Precios de ofertas (para mostrar en UI)
export const OFFER_PRICES = {
  '1': { price: 29, label: '1 oferta' },
  '5': { price: 120, label: 'Pack 5 ofertas', savings: 'Ahorras 25€' },
  '10': { price: 200, label: 'Pack 10 ofertas', savings: 'Ahorras 90€' },
};

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
  skipTrial: boolean = true, // Por defecto SIN trial
  billingPeriod: 'monthly' | 'yearly' = 'monthly'
) {
  try {
    const stripeInstance = getStripe();

    // Seleccionar el price ID según el periodo de facturación
    const priceId = billingPeriod === 'yearly'
      ? PREMIUM_PRICE_ID_YEARLY
      : PREMIUM_PRICE_ID;

    if (!priceId) {
      throw new Error(`No hay configurado un price ID para el periodo: ${billingPeriod}`);
    }

    // Construir datos de la suscripción
    const subscriptionData: any = {
      metadata: {
        userId,
        companyId,
        billingPeriod,
      },
    };

    // Solo añadir trial_period_days si explícitamente se quiere trial
    if (!skipTrial) {
      subscriptionData.trial_period_days = PREMIUM_CONFIG.trialDays;
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: subscriptionData,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        companyId,
        billingPeriod,
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Crear una sesión de checkout para pago de oferta (one-time payment)
export async function createOfferCheckoutSession(
  userId: string,
  userEmail: string,
  companyId: string,
  successUrl: string,
  cancelUrl: string,
  offerPack: '1' | '5' | '10'
) {
  try {
    const stripeInstance = getStripe();

    // Seleccionar el price ID según el pack
    const priceMap = {
      '1': OFFER_PRICE_ID_1,
      '5': OFFER_PRICE_ID_5,
      '10': OFFER_PRICE_ID_10,
    };

    const priceId = priceMap[offerPack];

    if (!priceId) {
      throw new Error(`No hay configurado un price ID para el pack de ofertas: ${offerPack}`);
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // Pago único, no suscripción
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        companyId,
        offerPack,
        paymentType: 'offer_pack',
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating offer checkout session:', error);
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
