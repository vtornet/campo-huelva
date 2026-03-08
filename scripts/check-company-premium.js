// Script para verificar la suscripción de una empresa específica
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanyPremium() {
  console.log('=== VERIFICANDO SUSCRIPCIÓN DE AGRO LEPE ===\n');

  // Buscar por email
  const companies = await prisma.user.findMany({
    where: {
      role: 'COMPANY',
      email: { contains: 'telefonica' }
    },
    include: {
      companyProfile: {
        include: {
          subscription: true,
        }
      }
    }
  });

  console.log(`Empresas encontradas con email que contiene 'telefonica': ${companies.length}\n`);

  for (const company of companies) {
    console.log('---');
    console.log(`Email: ${company.email}`);
    console.log(`User ID: ${company.id}`);
    console.log(`Company ID: ${company.companyProfile?.id || 'N/A'}`);
    console.log(`Company Name: ${company.companyProfile?.companyName || 'N/A'}`);

    const subscription = company.companyProfile?.subscription;
    if (subscription) {
      console.log(`\n📊 SUSCRIPCIÓN ENCONTRADA:`);
      console.log(`  ID: ${subscription.id}`);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Stripe Customer ID: ${subscription.stripeCustomerId}`);
      console.log(`  Stripe Subscription ID: ${subscription.stripeSubscriptionId}`);
      console.log(`  Current Period End: ${subscription.currentPeriodEnd}`);
    } else {
      console.log(`\n❌ SIN SUSCRIPCIÓN`);
    }
  }

  // También buscar todas las suscripciones para ver cuántas hay
  console.log('\n\n=== TODAS LAS SUSCRIPCIONES EN LA BD ===\n');
  const allSubscriptions = await prisma.subscription.findMany({
    include: {
      company: {
        select: {
          companyName: true,
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  console.log(`Total de suscripciones: ${allSubscriptions.length}\n`);
  for (const sub of allSubscriptions) {
    console.log(`- ${sub.company.companyName} (${sub.company.user.email})`);
    console.log(`  Status: ${sub.status}, Stripe Sub ID: ${sub.stripeSubscriptionId}`);
    console.log(`  Company ID: ${sub.companyId}`);
  }

  await prisma.$disconnect();
}

checkCompanyPremium().catch(console.error);
