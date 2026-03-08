const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Obtener el usuario con su perfil de empresa y suscripción
  const user = await prisma.user.findUnique({
    where: { id: '1izBQIwH1hPe2b5eSVdIoKQoP2g2' },
    include: {
      companyProfile: {
        include: {
          subscription: true,
        },
      },
    },
  });

  console.log('User role:', user.role);
  console.log('Has companyProfile:', !!user.companyProfile);

  const subscription = user.companyProfile?.subscription;
  console.log('Has subscription:', !!subscription);
  console.log('Subscription status:', subscription?.status);
  console.log('Current period end:', subscription?.currentPeriodEnd);
  console.log('Current period end > now:', subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date());

  // Verificar si la suscripción está activa
  const isActive =
    (subscription?.status === "ACTIVE" || subscription?.status === "TRIALING") &&
    (!subscription?.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date());

  console.log('Is Active:', isActive);
}

main().catch(console.error).finally(() => prisma.$disconnect());
