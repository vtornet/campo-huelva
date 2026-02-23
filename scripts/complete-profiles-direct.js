#!/usr/bin/env node

/**
 * Script para completar perfiles de prueba directamente en Prisma
 * Más rápido y confiable que usar Playwright para esta tarea
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cargar variables de entorno
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envFiles = ['.env.local', '.env', '.env.test'];
  const env = {};

  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          if (key && value) {
            env[key.trim()] = value.replace(/^[\"']|[\"']$/g, '');
          }
        }
      });
    }
  }

  Object.assign(process.env, env);
  return env;
}

loadEnv();

// Mapeo de emails a UIDs (de test-seed-data.json)
let seedData = {};
try {
  if (fs.existsSync('test-seed-data.json')) {
    seedData = JSON.parse(fs.readFileSync('test-seed-data.json', 'utf-8'));
  }
} catch (e) {
  console.log('⚠️  No se pudo leer test-seed-data.json');
}

async function main() {
  console.log('🔧 Completando perfiles de prueba directamente en Prisma...\n');

  // 1. Completar perfil de Trabajador
  console.log('👨‍🌾 Completando perfil de Trabajador...');
  try {
    const workerUid = seedData.users?.worker?.uid || 'osIapxLshbWRhTJNx5iBWfPmlM12';

    // Buscar si ya existe
    const existing = await prisma.workerProfile.findUnique({
      where: { userId: workerUid }
    });

    if (existing) {
      console.log('   ✅ Perfil de trabajador ya existe');
    } else {
      await prisma.workerProfile.create({
        data: {
          userId: workerUid,
          fullName: 'Juan Trabajador',
          phone: '+34 600 123 456',
          province: 'Huelva',
          city: 'Moguer',
          hasVehicle: true,
          canRelocate: true,
          canWorkAway: true,
          yearsExperience: 5,
          experience: ['Fresa', 'Arándano'],
          foodHandler: true,
          phytosanitaryLevel: 'Básico',
          machineryExperience: [],
          licenseTypes: [],
        }
      });
      console.log('   ✅ Perfil de trabajador creado');
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }

  // 2. Completar perfil de Manijero
  console.log('\n👷‍♂️ Completando perfil de Manijero...');
  try {
    const foremanUid = seedData.users?.foreman?.uid || 'fg0zSp53R5cFcTRwC6ZmIHgJt4A2';

    const existing = await prisma.foremanProfile.findUnique({
      where: { userId: foremanUid }
    });

    if (existing) {
      console.log('   ✅ Perfil de manijero ya existe');
    } else {
      await prisma.foremanProfile.create({
        data: {
          userId: foremanUid,
          fullName: 'Pedro Manijero',
          phone: '+34 600 222 333',
          province: 'Huelva',
          city: 'Lepe',
          crewSize: 8,
          workArea: ['Huelva'],
          hasVan: true,
          needsBus: false,
          ownTools: true,
          yearsExperience: 10,
          specialties: ['Fresa', 'Arándano', 'Frambuesa'],
        }
      });
      console.log('   ✅ Perfil de manijero creado');
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }

  // 3. Asegurar que la empresa está aprobada
  console.log('\n🏢 Verificando perfil de Empresa...');
  try {
    const companyUid = seedData.users?.company?.uid || 'jKWM3W3HP7STWon6QLdZuRroUO02';

    const existing = await prisma.companyProfile.findUnique({
      where: { userId: companyUid }
    });

    if (existing) {
      if (!existing.isApproved) {
        await prisma.companyProfile.update({
          where: { userId: companyUid },
          data: { isApproved: true }
        });
        console.log('   ✅ Empresa aprobada');
      } else {
        console.log('   ✅ Empresa ya aprobada');
      }
    } else {
      // Crear perfil de empresa
      const uniqueCif = `B${Date.now().toString().slice(-8)}`;
      await prisma.companyProfile.create({
        data: {
          userId: companyUid,
          companyName: 'Empresa Test S.L.',
          cif: uniqueCif,
          address: 'Polígono Industrial, Calle Test 123',
          province: 'Huelva',
          contactPerson: 'Ana Responsable',
          phone: '+34 959 123 456',
          description: 'Empresa dedicada al cultivo de frutos rojos.',
          isApproved: true,
        }
      });
      console.log('   ✅ Perfil de empresa creado y aprobado');
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}`);
  }

  console.log('\n✅ Perfiles completados correctamente!');
  console.log('\n🧪 Ahora puedes ejecutar los tests E2E:');
  console.log('   npm run test:e2e:ui\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
