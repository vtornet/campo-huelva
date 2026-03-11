// scripts/clean-cert.js
// Script para limpiar certificados PEM
// Uso: node scripts/clean-cert.js archivo_cert.pem archivo_key.pem

const fs = require('fs');

function cleanPemFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const cleaned = lines
    .map(line => line.trim())  // Eliminar espacios al inicio y final
    .filter(line => line.length > 0)  // Eliminar líneas vacías
    .join('\n');

  return cleaned;
}

// Obtener archivos de argumentos
const certFile = process.argv[2];
const keyFile = process.argv[3];

if (!certFile || !keyFile) {
  console.log('Uso: node scripts/clean-cert.js cert.pem key.pem');
  console.log('');
  console.log('Este script limpia los archivos PEM eliminando espacios al inicio de cada línea.');
  console.log('Crea archivos nuevos con sufijo .clean.pem');
  process.exit(1);
}

try {
  // Limpiar certificado
  const cleanedCert = cleanPemFile(certFile);
  fs.writeFileSync(certFile.replace('.pem', '.clean.pem'), cleanedCert);
  console.log(`✅ Certificado limpio: ${certFile.replace('.pem', '.clean.pem')}`);

  // Limpiar clave
  const cleanedKey = cleanPemFile(keyFile);
  fs.writeFileSync(keyFile.replace('.pem', '.clean.pem'), cleanedKey);
  console.log(`✅ Clave limpiada: ${keyFile.replace('.pem', '.clean.pem')}`);

  console.log('');
  console.log('Ahora copia el contenido de los archivos .clean.pem a Railway.');
  console.log('NO añadas comillas ni escapes. Solo copia y pega el contenido directamente.');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
