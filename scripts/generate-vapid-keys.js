// Script para generar claves VAPID para Web Push
const webpush = require('web-push');

// Generar claves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=== CLAVES VAPID GENERADAS ===\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\n================================\n');
console.log('Añade estas claves a tu archivo .env');
console.log('La clave pública puede ser compartida (NEXT_PUBLIC_*)');
console.log('La clave privada debe mantenerse secreta (VAPID_PRIVATE_KEY)');
