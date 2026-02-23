#!/usr/bin/env node

/**
 * Script para verificar el estado de los usuarios de prueba
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando usuarios de prueba...\n');

  // Buscar usuarios por email
  const testEmails = [
    'test-worker@example.com',
    'test-company@example.com',
    'test-foreman@example.com'
  ];

  for (const email of testEmails) {
    console.log(`📧 ${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        workerProfile: true,
        companyProfile: true,
        foremanProfile: true,
      }
    });

    if (!user) {
      console.log('   ❌ Usuario no encontrado en Prisma\n');
      continue;
    }

    console.log(`   ✅ Usuario encontrado (ID: ${user.id})`);
    console.log(`   Rol: ${user.role}`);

    if (user.workerProfile) {
      console.log(`   👨‍🌾 Perfil Worker: ${user.workerProfile.fullName || 'SIN NOMBRE'}`);
    }
    if (user.companyProfile) {
      console.log(`   🏢 Perfil Company: ${user.companyProfile.companyName || 'SIN NOMBRE'} (Aprobado: ${user.companyProfile.isApproved})`);
    }
    if (user.foremanProfile) {
      console.log(`   👷‍♂️ Perfil Foreman: ${user.foremanProfile.fullName || 'SIN NOMBRE'}`);
    }

    console.log('');
  }

  // Verificar posts creados
  console.log('📢 Posts en la base de datos:\n');

  const posts = await prisma.post.findMany({
    where: {
      title: {
        contains: 'recolección'
      }
    },
    take: 5
  });

  console.log(`   ${posts.length} posts encontrados con "recolección":`);
  posts.forEach(post => {
    console.log(`   - ${post.title} (${post.type}) - ID: ${post.id}`);
  });

  console.log('\n✅ Verificación completada');
}

main().catch(console.error).finally(() => prisma.$disconnect());
