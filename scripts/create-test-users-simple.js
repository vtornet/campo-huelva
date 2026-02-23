#!/usr/bin/env node

/**
 * Script simplificado para crear usuarios de prueba E2E
 *
 * Este script usa la API de registro existente (/api/register)
 * y crea los usuarios directamente en Firebase Auth usando la REST API.
 *
 * Uso:
 *   node scripts/create-test-users-simple.js
 *
 * Requisitos:
 *   - Servidor de desarrollo corriendo (npm run dev)
 *   - Variables de entorno de Firebase configuradas
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local o .env
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
            // Eliminar comillas si existen
            env[key.trim()] = value.replace(/^["']|["']$/g, '');
          }
        }
      });
    }
  }

  // Asignar al process.env
  Object.assign(process.env, env);
  return env;
}

loadEnv();

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error('❌ Error: NEXT_PUBLIC_FIREBASE_API_KEY no está definida');
  console.log('   Buscando en archivos: .env.local, .env, .env.test');
  console.log('   Asegúrate de tener una variable como:');
  console.log('   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX\n');
  console.log('   Si no tienes las credenciales a mano, puedes:');
  console.log('   1. Ir a Firebase Console > Project Settings');
  console.log('   2. Copiar tu API Key');
  console.log('   3. Añadirla a tu archivo .env.local\n');
  console.log('   Alternativa: Ejecuta los tests E2E sin usuarios configurados.');
  console.log('   Muchos tests están marcados con skip() y se activarán cuando');
  console.log('   configures las credenciales.\n');
  process.exit(1);
}

const testUsers = [
  { email: 'test-worker@example.com', role: 'WORKER', name: 'Juan Trabajador' },
  { email: 'test-foreman@example.com', role: 'FOREMAN', name: 'Pedro Manijero' },
  { email: 'test-engineer@example.com', role: 'ENGINEER', name: 'Carlos Ingeniero' },
  { email: 'test-encargado@example.com', role: 'ENCARGADO', name: 'Luis Encargado' },
  { email: 'test-tractorista@example.com', role: 'TRACTORISTA', name: 'Miguel Tractorista' },
  { email: 'test-company@example.com', role: 'COMPANY', name: 'Empresa Test S.L.' },
  { email: 'test-admin@example.com', role: 'ADMIN', name: 'Admin Test' },
];

const password = 'Test123456!';

/**
 * Crear usuario en Firebase Auth usando REST API
 */
async function createFirebaseUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

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
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`   ⚠️  Email ya existe en Firebase: ${email}`);
        // Intentar hacer login para obtener el UID
        return getFirebaseUid(email, password);
      }
      throw new Error(data.error.message);
    }

    console.log(`   ✅ Usuario creado en Firebase: ${email}`);
    return data.localId;
  } catch (error) {
    console.error(`   ❌ Error en Firebase: ${error.message}`);
    return null;
  }
}

/**
 * Obtener UID de usuario existente mediante login
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
      console.error(`   ❌ Error obteniendo UID: ${data.error.message}`);
      return null;
    }

    console.log(`   ✅ UID obtenido: ${data.localId}`);
    return data.localId;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Registrar usuario en Prisma a través de la API
 */
async function registerInPrisma(uid, email, role) {
  try {
    const response = await fetch(`${baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        email,
        role,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`   ✅ Usuario registrado en Prisma (role: ${role})`);
      return true;
    }

    // Si el usuario ya existe
    if (data.error || data.exists) {
      console.log(`   ⚠️  Usuario ya existe en Prisma`);
      return false;
    }

    return false;
  } catch (error) {
    console.error(`   ❌ Error en Prisma: ${error.message}`);
    return false;
  }
}

/**
 * Verificar que el servidor está corriendo
 */
async function checkServer() {
  try {
    const response = await fetch(`${baseURL}/api/health`, {
      timeout: 5000,
    }).catch(() => ({ ok: false }));

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Creando usuarios de prueba para E2E Testing\n');
  console.log(`📍 Base URL: ${baseURL}`);
  console.log(`🔑 Firebase API Key: ${apiKey.substring(0, 10)}...\n`);

  // Verificar servidor
  console.log('⏳ Verificando servidor...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('⚠️  ADVERTENCIA: El servidor no parece estar corriendo.');
    console.log('   Asegúrate de ejecutar: npm run dev\n');
  } else {
    console.log('✅ Servidor detectado\n');
  }

  // Crear usuarios
  console.log('📝 Creando usuarios...\n');

  const results = [];

  for (const user of testUsers) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👤 ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);

    // Crear en Firebase (o obtener UID si ya existe)
    const uid = await createFirebaseUser(user.email, password);

    if (uid && serverRunning) {
      // Registrar en Prisma
      await registerInPrisma(uid, user.email, user.role);
    }

    results.push({ ...user, uid, password });
    console.log();
  }

  // Crear archivo .env.test
  console.log('📄 Creando archivo .env.test...');

  const envContent = `# Variables de entorno para E2E Testing
# Generado automáticamente por create-test-users-simple.js

BASE_URL=${baseURL}

# Usuario de prueba - Trabajador
TEST_WORKER_EMAIL=${testUsers[0].email}
TEST_WORKER_PASSWORD=${password}

# Usuario de prueba - Jefe de Cuadrilla
TEST_FOREMAN_EMAIL=${testUsers[1].email}
TEST_FOREMAN_PASSWORD=${password}

# Usuario de prueba - Ingeniero
TEST_ENGINEER_EMAIL=${testUsers[2].email}
TEST_ENGINEER_PASSWORD=${password}

# Usuario de prueba - Encargado
TEST_ENCARGADO_EMAIL=${testUsers[3].email}
TEST_ENCARGADO_PASSWORD=${password}

# Usuario de prueba - Tractorista
TEST_TRACTORISTA_EMAIL=${testUsers[4].email}
TEST_TRACTORISTA_PASSWORD=${password}

# Usuario de prueba - Empresa
TEST_COMPANY_EMAIL=${testUsers[5].email}
TEST_COMPANY_PASSWORD=${password}

# Usuario de prueba - Admin
TEST_ADMIN_EMAIL=${testUsers[6].email}
TEST_ADMIN_PASSWORD=${password}
`;

  const fs = require('fs');
  fs.writeFileSync('.env.test', envContent);
  console.log('✅ Archivo .env.test creado!\n');

  // Resumen
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Listo! Usuarios de prueba creados.\n');
  console.log('📋 Credenciales:');
  console.log('   Email: test-worker@example.com');
  console.log('   Password: Test123456!');
  console.log('   (Todos los usuarios usan la misma contraseña)\n');
  console.log('🧪 Para ejecutar los tests E2E:');
  console.log('   1. Asegúrate de tener el servidor corriendo: npm run dev');
  console.log('   2. Ejecuta: npm run test:e2e:ui\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
