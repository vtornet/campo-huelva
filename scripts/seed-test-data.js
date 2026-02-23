#!/usr/bin/env node

/**
 * Script de Sembrado de Datos (Seed Data) para E2E Testing
 *
 * Crea posts, inscripciones y otros datos de prueba necesarios para los tests E2E.
 *
 * Uso:
 *   node scripts/seed-test-data.js
 *
 * Requisitos:
 *   - Servidor corriendo (npm run dev)
 *   - Usuarios de prueba creados (npm run test:users:create)
 *   - Perfiles completados (npm run test:profiles:complete)
 */

const fs = require('fs');
const path = require('path');

// Importar Prisma para aprobar la empresa
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cargar variables de entorno
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
            env[key.trim()] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  }

  Object.assign(process.env, env);
  return env;
}

loadEnv();

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Usuarios de prueba
const testUsers = {
  worker: { email: 'test-worker@example.com', password: 'Test123456!', uid: null },
  company: { email: 'test-company@example.com', password: 'Test123456!', uid: null },
  foreman: { email: 'test-foreman@example.com', password: 'Test123456!', uid: null },
};

// Datos de prueba para posts
const testPosts = {
  ofertaEmpresa: {
    type: 'OFFICIAL',
    title: 'Recolectores de Fresa - Campaña Primavera 2026',
    province: 'Huelva',
    location: 'Lepe',
    description: 'Buscamos 30 recolectores de fresa para campaña de primavera. Jornada completa de 8 horas, de lunes a viernes. Alojamiento incluido para personas desplazadas.',
    contractType: 'TEMPORAL',
    providesAccommodation: true,
    salaryAmount: '45',
    salaryPeriod: 'DAILY',
    hoursPerWeek: '40',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
  },
  demandaTrabajador: {
    type: 'DEMAND',
    title: 'Trabajador disponible para recolección',
    province: 'Huelva',
    location: 'Moguer',
    description: 'Trabajador con 5 años de experiencia en recolección de fresa y arándanos. Disponible inmediato. Tengo vehículo propio.',
    taskType: 'Recolección de frutos rojos',
  },
  demandaManijero: {
    type: 'DEMAND',
    title: 'Cuadrilla completa de 8 personas disponible',
    province: 'Huelva',
    location: 'Lepe',
    description: 'Cuadrilla formada de 8 personas con experiencia. Tenemos furgoneta propia y herramientas de poda y recolección.',
    taskType: 'Recolección de frutos rojos',
  },
};

/**
 * Obtener UID de usuario desde Firebase
 */
async function getFirebaseUid(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error(`   ❌ Error obteniendo UID para ${email}: ${data.error.message}`);
      return null;
    }

    return data.localId;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Crear post a través de la API
 */
async function createPost(uid, postData) {
  try {
    // La API espera el UID en el body
    const requestBody = {
      ...postData,
      uid: uid,
    };

    const response = await fetch(`${baseURL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Post creado: ${postData.title}`);
      console.log(`      ID: ${data.id}`);
      return data;
    } else {
      console.error(`   ❌ Error creando post "${postData.title}":`);
      console.error(`      ${data.error || JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Inscribir usuario en una oferta
 */
async function applyToPost(userUid, postId) {
  try {
    const response = await fetch(`${baseURL}/api/posts/${postId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: userUid,
      }),
    });

    if (response.ok) {
      console.log(`   ✅ Inscripción creada para post ${postId}`);
      return true;
    } else {
      const text = await response.text();
      console.error(`   ❌ Error inscribiendo (status ${response.status}): ${text.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Crear perfil de empresa para prueba
 */
async function createCompanyProfile(companyUid) {
  try {
    const existing = await prisma.companyProfile.findUnique({
      where: { userId: companyUid },
    });

    if (existing) {
      // Ya existe, actualizar a aprobado
      const updated = await prisma.companyProfile.update({
        where: { userId: companyUid },
        data: { isApproved: true },
      });
      console.log('   ✅ Perfil de empresa ya existe, ahora aprobado');
      return updated;
    }

    // Crear con CIF único (timestamp para evitar duplicados)
    const uniqueCif = `B${Date.now().toString().slice(-8)}`;
    const profile = await prisma.companyProfile.create({
      data: {
        userId: companyUid,
        companyName: 'Empresa Test S.L.',
        cif: uniqueCif,
        address: 'Polígono Industrial, Calle Test 123',
        province: 'Huelva',
        contactPerson: 'Ana Responsable',
        phone: '+34 959 123 456',
        description: 'Empresa dedicada al cultivo de frutos rojos.',
        isApproved: true, // Aprobamos directamente para testing
      },
    });
    console.log('   ✅ Perfil de empresa creado y aprobado');
    return profile;
  } catch (error) {
    console.error(`   ❌ Error creando perfil: ${error.message}`);
    return null;
  }
}

/**
 * Aprobar empresa para que pueda publicar ofertas
 */
async function approveCompany(companyUid) {
  try {
    const result = await prisma.companyProfile.update({
      where: { userId: companyUid },
      data: { isApproved: true },
    });
    console.log('   ✅ Empresa aprobada para publicar ofertas');
    return true;
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('   ⚠️  Empresa no tiene perfil en Prisma, creándolo...');
      const profile = await createCompanyProfile(companyUid);
      return profile !== null;
    }
    console.error(`   ❌ Error aprobando empresa: ${error.message}`);
    return false;
  }
}

/**
 * Registrar usuario en Prisma si no existe
 */
async function registerUserInPrisma(uid, email, role) {
  try {
    const response = await fetch(`${baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, role }),
    });

    const data = await response.json();

    if (response.ok || data.exists || data.id) {
      console.log(`   ✅ Usuario registrado en Prisma (${role})`);
      return true;
    } else {
      console.log(`   ⚠️  Registro en Prisma: ${data.error || 'ya existe'}`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Error registrando: ${error.message}`);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🌱 Sembrando datos de prueba para E2E Testing...\n');

  // Verificar servidor
  console.log('⏳ Verificando servidor...');
  try {
    await fetch(`${baseURL}/api/health`);
    console.log('✅ Servidor detectado\n');
  } catch {
    console.log('⚠️  Servidor no detectado. Asegúrate de ejecutar: npm run dev\n');
    process.exit(1);
  }

  // Obtener UIDs de los usuarios
  console.log('📝 Obteniendo UIDs de usuarios de prueba...\n');

  for (const [key, user] of Object.entries(testUsers)) {
    console.log(`   📧 ${user.email}`);
    const uid = await getFirebaseUid(user.email, user.password);
    if (uid) {
      testUsers[key].uid = uid;
      console.log(`      UID: ${uid}\n`);
    } else {
      console.log(`      ⚠️  No se pudo obtener UID. Ejecuta: npm run test:users:create\n`);
      process.exit(1);
    }
  }

  if (!testUsers.worker.uid || !testUsers.company.uid) {
    console.log('❌ Error: No se pudieron obtener los UIDs necesarios');
    process.exit(1);
  }

  // Asegurar que los usuarios están registrados en Prisma
  console.log('\n📝 Asegurando que los usuarios están registrados en Prisma...');

  console.log(`   📧 ${testUsers.worker.email} (WORKER)`);
  await registerUserInPrisma(testUsers.worker.uid, testUsers.worker.email, 'WORKER');

  console.log(`   📧 ${testUsers.company.email} (COMPANY)`);
  await registerUserInPrisma(testUsers.company.uid, testUsers.company.email, 'COMPANY');

  console.log(`   📧 ${testUsers.foreman.email} (FOREMAN)`);
  await registerUserInPrisma(testUsers.foreman.uid, testUsers.foreman.email, 'FOREMAN');

  // Crear posts
  console.log('\n📢 Creando posts de prueba...');

  const postsCreated = [];

  // NOTA: La oferta de empresa puede fallar si la empresa no está aprobada por admin
  // Primero creamos las demandas (no requieren aprobación)

  // Demanda del trabajador
  console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   👨‍🌾 Demanda de Trabajo (Trabajador)');
  const demandaPost = await createPost(testUsers.worker.uid, {
    ...testPosts.demandaTrabajador,
  });
  if (demandaPost) {
    postsCreated.push({ ...demandaPost, type: 'DEMANDA_TRABAJADOR' });
  }

  // Demanda del manijero (si tenemos el UID)
  if (testUsers.foreman.uid) {
    console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   👷‍♂️ Demanda de Cuadrilla (Manijero)');
    const demandaManijero = await createPost(testUsers.foreman.uid, {
      ...testPosts.demandaManijero,
    });
    if (demandaManijero) {
      postsCreated.push({ ...demandaManijero, type: 'DEMANDA_MANIJERO' });
    }
  }

  // Oferta de empresa
  console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   📦 Oferta de Empleo (Empresa)');
  console.log('   ⏳ Aprobando empresa de prueba...');
  await approveCompany(testUsers.company.uid);

  const ofertaPost = await createPost(testUsers.company.uid, {
    ...testPosts.ofertaEmpresa,
  });
  if (ofertaPost) {
    postsCreated.push({ ...ofertaPost, type: 'OFERTA_EMPRESA' });
  }

  // Crear inscripciones
  console.log('\n\n📝 Creando inscripciones...');

  const ofertaPostId = postsCreated.find(p => p.type === 'OFERTA_EMPRESA')?.id;
  if (ofertaPostId) {
    console.log('\n   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   📝 Inscribiendo trabajador en oferta ${ofertaPostId}...`);
    await applyToPost(testUsers.worker.uid, ofertaPostId);
  }

  // Guardar IDs de posts creados para referencia
  const seedData = {
    created: new Date().toISOString(),
    users: {
      worker: { email: testUsers.worker.email, uid: testUsers.worker.uid },
      company: { email: testUsers.company.email, uid: testUsers.company.uid },
      foreman: { email: testUsers.foreman.email, uid: testUsers.foreman.uid },
    },
    posts: postsCreated.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
    })),
  };

  fs.writeFileSync('test-seed-data.json', JSON.stringify(seedData, null, 2));
  console.log('\n\n📄 Datos de sembrado guardados en: test-seed-data.json');

  // Resumen
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Datos de prueba sembrados correctamente!\n');
  console.log('📊 Resumen:');
  console.log(`   • Usuarios: ${Object.keys(testUsers).length}`);
  console.log(`   • Posts creados: ${postsCreated.length}`);
  console.log(`   • Inscripciones: 1\n`);
  console.log('🧪 Ahora puedes ejecutar los tests E2E completos:');
  console.log('   npm run test:e2e:ui\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
