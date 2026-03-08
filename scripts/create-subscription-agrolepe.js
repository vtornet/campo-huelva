// Script para crear suscripción manual para Agro Lepe
const { PrismaClient, SubscriptionStatus, SubscriptionAction } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSubscriptionForAgroLepe() {
  console.log('=== CREANDO SUSCRIPCIÓN PARA AGRO LEPE ===\n');

  // Buscar Agro Lepe
  const agroLepe = await prisma.user.findUnique({
    where: { email: 'vtornet@telefonica.net' },
    include: { companyProfile: true }
  });

  if (!agroLepe) {
    console.log('❌ Usuario no encontrado');
    await prisma.$disconnect();
    return;
  }

  console.log(`Empresa: ${agroLepe.companyProfile?.companyName}`);
  console.log(`User ID: ${agroLepe.id}`);
  console.log(`Company ID: ${agroLepe.companyProfile?.id}`);

  // Verificar si ya tiene suscripción
  const existing = await prisma.subscription.findUnique({
    where: { companyId: agroLepe.companyProfile.id }
  });

  if (existing) {
    console.log('\n⚠️  Ya tiene suscripción. Actualizando status a ACTIVE...');
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días de prueba
      }
    });
    console.log('✅ Suscripción actualizada a ACTIVE');
  } else {
    // Crear suscripción
    const now = new Date();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const subscription = await prisma.subscription.create({
      data: {
        companyId: agroLepe.companyProfile.id,
        stripeCustomerId: 'cus_test_manual_agrolepe',
        stripeSubscriptionId: 'sub_test_manual_agrolepe',
        stripePriceId: 'price_test_99eur',
        status: SubscriptionStatus.ACTIVE,
        isTrial: true,
        trialEndsAt: trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        history: {
          create: {
            action: SubscriptionAction.CREATED,
            toStatus: SubscriptionStatus.ACTIVE,
            changeReason: 'Suscripción creada manualmente para pruebas',
          }
        }
      }
    });

    console.log('\n✅ SUSCRIPCIÓN CREADA:');
    console.log(`  ID: ${subscription.id}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Trial ends: ${subscription.trialEndsAt}`);
    console.log(`  Period ends: ${subscription.currentPeriodEnd}`);
  }

  // Verificar que funciona
  const verify = await prisma.user.findUnique({
    where: { id: agroLepe.id },
    include: {
      companyProfile: {
        include: { subscription: true }
      }
    }
  });

  console.log('\n📊 VERIFICACIÓN:');
  console.log(`  Tiene suscripción: ${!!verify.companyProfile?.subscription}`);
  console.log(`  Status: ${verify.companyProfile?.subscription?.status}`);
  console.log(`  Es Premium: ${verify.companyProfile?.subscription?.status === 'ACTIVE' || verify.companyProfile?.subscription?.status === 'TRIALING'}`);

  await prisma.$disconnect();
}

createSubscriptionForAgroLepe().catch(console.error);
