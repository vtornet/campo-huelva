// Script para probar notificaciones push
const webpush = require('web-push');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

console.log('=== Prueba de Notificaciones Push ===\n');
console.log('VAPID Public Key:', VAPID_PUBLIC_KEY ? '✓ Configurada' : '✗ NO configurada');
console.log('VAPID Private Key:', VAPID_PRIVATE_KEY ? '✓ Configurada' : '✗ NO configurada');

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('\n❌ ERROR: Las claves VAPID no están configuradas en .env.local');
  console.log('Por favor, añade las siguientes líneas a .env.local:');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY="tu-clave-publica"');
  console.log('VAPID_PRIVATE_KEY="tu-clave-privada"');
  process.exit(1);
}

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:contact@appstracta.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

console.log('\n✓ VAPID configurado correctamente');
console.log('\nClaves:');
console.log('Pública:', VAPID_PUBLIC_KEY);
console.log('Privada:', VAPID_PRIVATE_KEY.substring(0, 10) + '...');

// Generar nuevas claves si es necesario
console.log('\n=== Generar nuevas claves VAPID ===');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Nueva Public Key:', vapidKeys.publicKey);
console.log('Nueva Private Key:', vapidKeys.privateKey);

console.log('\n=== Pasos para configurar en Railway ===');
console.log('1. Ve a tu proyecto en Railway');
console.log('2. Ve a la pestaña "Variables"');
console.log('3. Añade las siguientes variables:');
console.log('   - NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + VAPID_PUBLIC_KEY);
console.log('   - VAPID_PRIVATE_KEY=' + VAPID_PRIVATE_KEY);
console.log('4. Redespliega la aplicación');
