// Script para probar el endpoint de suscripción directamente
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSubscriptionEndpoint() {
  console.log('=== PROBANDO LÓGICA DEL ENDPOINT /api/subscription/status ===\n');

  const userId = '1izBQIwH1hPe2b5eSVdIoKQoP2g2';

  // Simular el endpoint
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
    console.log('❌ Usuario no encontrado');
    return;
  }

  console.log(`Usuario: ${user.email}`);
  console.log(`Rol: ${user.role}`);

  if (user.role !== Role.COMPANY) {
    console.log('❌ No es empresa');
    return;
  }

  if (!user.companyProfile) {
    console.log('❌ No tiene perfil de empresa');
    return;
  }

  const subscription = user.companyProfile.subscription;

  console.log('\n📊 SUSCRIPCIÓN:');
  console.log(`  Existe: ${!!subscription}`);
  if (subscription) {
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Current Period End: ${subscription.currentPeriodEnd}`);
    console.log(`  Trial Ends At: ${subscription.trialEndsAt}`);
  }

  // Cálculo de isActive (del endpoint)
  const now = new Date();
  const isActive =
    subscription &&
    (subscription.status === "ACTIVE" ||
      subscription.status === "TRIALING") &&
    (!subscription.currentPeriodEnd ||
      new Date(subscription.currentPeriodEnd) > now);

  console.log('\n📅 VERIFICACIÓN:');
  console.log(`  Ahora: ${now.toISOString()}`);
  if (subscription?.currentPeriodEnd) {
    console.log(`  Period End: ${subscription.currentPeriodEnd.toISOString()}`);
    console.log(`  Period End > Ahora: ${new Date(subscription.currentPeriodEnd) > now}`);
  }

  console.log(`\n✅ Resultado isActive: ${isActive}`);
  console.log(`✅ isPremium que devolvería el endpoint: ${isActive || false}`);

  // Cálculo de isTrial
  const isTrial =
    subscription &&
    subscription.isTrial &&
    subscription.trialEndsAt &&
    new Date(subscription.trialEndsAt) > now;

  console.log(`\n✅ Resultado isTrial: ${isTrial || false}`);

  await prisma.$disconnect();
}

testSubscriptionEndpoint().catch(console.error);
