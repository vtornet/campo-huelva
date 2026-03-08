// Script para verificar el estado de suscripciones premium
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPremiumStatus() {
  console.log('=== VERIFICANDO SUSCRIPCIONES PREMIUM ===\n');

  // Obtener todas las empresas
  const companies = await prisma.user.findMany({
    where: { role: 'COMPANY' },
    include: {
      companyProfile: {
        include: {
          subscription: true,
        }
      }
    }
  });

  console.log(`Total de empresas: ${companies.length}\n`);

  for (const company of companies) {
    console.log('---');
    console.log(`Empresa: ${company.companyProfile?.companyName || 'N/A'}`);
    console.log(`Email: ${company.email}`);
    console.log(`User ID: ${company.id}`);
    console.log(`Company ID: ${company.companyProfile?.id || 'N/A'}`);

    const subscription = company.companyProfile?.subscription;
    if (subscription) {
      console.log(`\n📊 SUSCRIPCIÓN:`);
      console.log(`  ID: ${subscription.id}`);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Stripe Customer ID: ${subscription.stripeCustomerId || 'N/A'}`);
      console.log(`  Stripe Subscription ID: ${subscription.stripeSubscriptionId || 'N/A'}`);
      console.log(`  Price ID: ${subscription.stripePriceId || 'N/A'}`);
      console.log(`  Is Trial: ${subscription.isTrial}`);
      console.log(`  Trial Ends At: ${subscription.trialEndsAt || 'N/A'}`);
      console.log(`  Current Period Start: ${subscription.currentPeriodStart || 'N/A'}`);
      console.log(`  Current Period End: ${subscription.currentPeriodEnd || 'N/A'}`);
      console.log(`  Cancel at Period End: ${subscription.cancelAtPeriodEnd}`);

      // Verificar si debería ser considerada premium activa
      const now = new Date();
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;

      const isActive = subscription.status === 'ACTIVE' || subscription.status === 'TRIALING';
      const periodValid = !periodEnd || periodEnd > now;
      const trialValid = subscription.isTrial && trialEnd && trialEnd > now;

      console.log(`\n✅ VERIFICACIÓN:`);
      console.log(`  Status es ACTIVE/TRIALING: ${isActive}`);
      console.log(`  Periodo válido: ${periodValid} ${periodEnd ? `(${periodEnd.toISOString()} vs ${now.toISOString()})` : '(sin fecha)'}`);
      console.log(`  Trial válido: ${trialValid} ${trialEnd ? `(${trialEnd.toISOString()} vs ${now.toISOString()})` : '(sin fecha)'}`);
      console.log(`  \n🎁 ES PREMIUM ACTIVO: ${(isActive && periodValid) || trialValid}`);
    } else {
      console.log(`\n❌ SIN SUSCRIPCIÓN`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkPremiumStatus().catch(console.error);
