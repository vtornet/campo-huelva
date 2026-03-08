const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: '1izBQIwH1hPe2b5eSVdIoKQoP2g2' },
    include: { companyProfile: true }
  });
  console.log('Usuario:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
