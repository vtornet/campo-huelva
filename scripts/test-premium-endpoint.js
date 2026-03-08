// Script para probar la verificación de premium (copia de la lógica)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copia de la función hasActivePremiumSubscription
async function hasActivePremiumSubscription(userId) {
  try {
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

    if (!user || user.role !== 'COMPANY' || !user.companyProfile) {
      return false;
    }

    const subscription = user.companyProfile.subscription;
    if (!subscription) {
      return false;
    }

    const isActive =
      (subscription.status === "ACTIVE" ||
        subscription.status === "TRIALING") &&
      (!subscription.currentPeriodEnd ||
        new Date(subscription.currentPeriodEnd) > new Date());

    return isActive;
  } catch (error) {
    console.error("Error checking premium subscription:", error);
    return false;
  }
}

async function testPremiumCheck() {
  console.log('=== PROBANDO VERIFICACIÓN DE PREMIUM ===\n');

  // Obtener la empresa con suscripción
  const empresa = await prisma.user.findUnique({
    where: { id: '1izBQIwH1hPe2b5eSVdIoKQoP2g2' }, // empresa@gmail.com
    include: {
      companyProfile: {
        include: {
          subscription: true,
        }
      }
    }
  });

  if (!empresa) {
    console.log('❌ Empresa no encontrada');
    return;
  }

  console.log(`Empresa: ${empresa.companyProfile?.companyName}`);
  console.log(`Email: ${empresa.email}`);
  console.log(`Rol: ${empresa.role}`);
  console.log(`User ID: ${empresa.id}`);
  console.log(`CompanyProfile ID: ${empresa.companyProfile?.id}`);

  const subscription = empresa.companyProfile?.subscription;
  if (subscription) {
    console.log(`\n📊 SUSCRIPCIÓN:`);
    console.log(`  ID: ${subscription.id}`);
    console.log(`  Status: ${subscription.status}`);
    console.log(`  Current Period End: ${subscription.currentPeriodEnd}`);
  }

  // Probar la función de verificación
  const isPremium = await hasActivePremiumSubscription(empresa.id);
  console.log(`\n✅ Resultado hasActivePremiumSubscription(): ${isPremium}`);

  // Probar también el endpoint response
  console.log('\n📡 Simulando respuesta del endpoint /api/subscription/status:');
  const isActive = subscription &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING") &&
    (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date());

  console.log(`  isActive: ${isActive}`);
  console.log(`  isPremium que devolvería: ${isActive || false}`);

  await prisma.$disconnect();
}

testPremiumCheck().catch(console.error);
