const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'COMPANY' },
    include: { companyProfile: true },
    take: 5
  });
  console.log('Empresas encontradas:', users.length);
  users.forEach(u => {
    console.log('ID:', u.id, 'Email:', u.email, 'Empresa:', u.companyProfile?.companyName || 'N/A');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
