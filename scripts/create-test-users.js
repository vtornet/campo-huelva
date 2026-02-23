#!/usr/bin/env node

/**
 * Script para crear usuarios de prueba para E2E Testing
 *
 * Uso:
 *   node scripts/create-test-users.js
 *
 * Requiere:
 *   - Variables de entorno de Firebase configuradas
 *   - Service Account de Firebase (opcional, para Admin SDK)
 */

const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configuración de usuarios de prueba
const testUsers = [
  {
    email: 'test-worker@example.com',
    password: 'Test123456!',
    role: 'WORKER',
    displayName: 'Juan Trabajador',
  },
  {
    email: 'test-foreman@example.com',
    password: 'Test123456!',
    role: 'FOREMAN',
    displayName: 'Pedro Manijero',
  },
  {
    email: 'test-engineer@example.com',
    password: 'Test123456!',
    role: 'ENGINEER',
    displayName: 'Carlos Ingeniero',
  },
  {
    email: 'test-company@example.com',
    password: 'Test123456!',
    role: 'COMPANY',
    displayName: 'Empresa Test S.L.',
  },
  {
    email: 'test-encargado@example.com',
    password: 'Test123456!',
    role: 'ENCARGADO',
    displayName: 'Luis Encargado',
  },
  {
    email: 'test-tractorista@example.com',
    password: 'Test123456!',
    role: 'TRACTORISTA',
    displayName: 'Miguel Tractorista',
  },
  {
    email: 'test-admin@example.com',
    password: 'Test123456!',
    role: 'ADMIN',
    displayName: 'Admin Test',
  },
];

// Función para inicializar Firebase Admin
function initFirebase() {
  // Intentar usar el SDK de cliente si no hay service account
  // Nota: Para crear usuarios, preferiblemente usar Admin SDK con service account
  // Si no está disponible, usaremos un método alternativo

  try {
    // Verificar si tenemos credenciales de service account
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountPath) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin inicializado con Service Account');
      return admin.auth();
    }
  } catch (error) {
    console.log('⚠️  No se encontró Service Account, usando método alternativo...');
  }

  // Método alternativo: Inicializar con config del cliente
  // Nota: Esto no permite crear usuarios directamente, necesita un endpoint API
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Error: No se encontró configuración de Firebase');
    console.log('Asegúrate de tener NEXT_PUBLIC_FIREBASE_* en tu .env.local');
    process.exit(1);
  }

  return null;
}

// Función para crear usuario usando Admin SDK
async function createUserWithAdmin(auth, userData) {
  try {
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true, // Marcar como verificado para testing
    });

    // Establecer claims personalizados (role)
    await auth.setCustomUserClaims(userRecord.uid, {
      role: userData.role,
    });

    console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`);
    console.log(`   UID: ${userRecord.uid}`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  Usuario ya existe: ${userData.email}`);
      console.log(`   Actualizando claims...`);

      // Buscar usuario por email y actualizar claims
      const userRecord = await auth.getUserByEmail(userData.email);
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role,
      });
      console.log(`   ✅ Claims actualizados`);
      return userRecord;
    } else {
      console.error(`❌ Error creando ${userData.email}:`, error.message);
      return null;
    }
  }
}

// Función para crear usuarios usando API REST (alternativa)
async function createUserWithREST(userData) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`⚠️  Usuario ya existe: ${userData.email}`);
        return { email: userData.email, localId: 'exists' };
      }
      throw new Error(data.error.message);
    }

    console.log(`✅ Usuario creado: ${userData.email}`);
    console.log(`   UID: ${data.localId}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creando ${userData.email}:`, error.message);
    return null;
  }
}

// Función para crear usuarios en Prisma (a través de API)
async function createUserInPrisma(userData) {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseURL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: userData.uid || userData.localId,
        email: userData.email,
        role: userData.role,
      }),
    });

    if (response.ok) {
      console.log(`   ✅ Usuario registrado en Prisma`);
      return true;
    } else {
      console.log(`   ⚠️  Usuario ya existe en Prisma o error`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  No se pudo registrar en Prisma (servidor no corriendo?)`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 Creando usuarios de prueba para E2E Testing...\n');

  // Inicializar Firebase
  const auth = initFirebase();

  // Verificar si el servidor está corriendo
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  try {
    await fetch(`${baseURL}/api/health`);
    console.log(`✅ Servidor corriendo en ${baseURL}\n`);
  } catch {
    console.log(`⚠️  Servidor no detectado en ${baseURL}`);
    console.log(`   Inicia el servidor con: npm run dev\n`);
  }

  if (auth) {
    // Usar Admin SDK
    console.log('📝 Creando usuarios con Firebase Admin SDK...\n');

    for (const user of testUsers) {
      const userRecord = await createUserWithAdmin(auth, user);
      if (userRecord) {
        await createUserInPrisma({ ...user, uid: userRecord.uid });
      }
      console.log();
    }

    console.log('✨ Usuarios de prueba creados correctamente!\n');
    console.log('📋 Credenciales:');
    console.log('   Email: test-worker@example.com');
    console.log('   Password: Test123456!\n');
    console.log('   (Todos los usuarios usan la misma contraseña)\n');
  } else {
    // Usar API REST
    console.log('📝 Creando usuarios con Firebase REST API...\n');
    console.log('⚠️  Nota: Este método crea usuarios pero no asigna roles (claims).');
    console.log('   Los roles se asignarán al crear el perfil en Prisma.\n');

    for (const user of testUsers) {
      const userData = await createUserWithREST(user);
      if (userData) {
        await createUserInPrisma({ ...user, uid: userData.localId });
      }
      console.log();
    }

    console.log('✨ Usuarios de prueba creados!\n');
  }

  // Crear archivo .env.test
  const envContent = `# Variables de entorno para E2E Testing
# Generado automáticamente por create-test-users.js

BASE_URL=${baseURL}

# Usuario de prueba - Trabajador
TEST_WORKER_EMAIL=test-worker@example.com
TEST_WORKER_PASSWORD=Test123456!

# Usuario de prueba - Jefe de Cuadrilla
TEST_FOREMAN_EMAIL=test-foreman@example.com
TEST_FOREMAN_PASSWORD=Test123456!

# Usuario de prueba - Ingeniero
TEST_ENGINEER_EMAIL=test-engineer@example.com
TEST_ENGINEER_PASSWORD=Test123456!

# Usuario de prueba - Encargado
TEST_ENCARGADO_EMAIL=test-encargado@example.com
TEST_ENCARGADO_PASSWORD=Test123456!

# Usuario de prueba - Tractorista
TEST_TRACTORISTA_EMAIL=test-tractorista@example.com
TEST_TRACTORISTA_PASSWORD=Test123456!

# Usuario de prueba - Empresa
TEST_COMPANY_EMAIL=test-company@example.com
TEST_COMPANY_PASSWORD=Test123456!

# Usuario de prueba - Admin
TEST_ADMIN_EMAIL=test-admin@example.com
TEST_ADMIN_PASSWORD=Test123456!
`;

  const fs = require('fs');
  fs.writeFileSync('.env.test', envContent);
  console.log('📄 Archivo .env.test creado!\n');

  process.exit(0);
}

// Ejecutar
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
