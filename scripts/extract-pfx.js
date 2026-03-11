// scripts/extract-pfx.js
// Extrae certificado y clave de un archivo .pfx/.p12
// Uso: node scripts/extract-pfx.js archivo.pfx contraseña

const fs = require('fs');
const crypto = require('crypto');

function extractFromPFX(pfxPath, password) {
  // Leer el archivo PFX
  const pfxData = fs.readFileSync(pfxPath);

  // Extraer certificado y clave
  const pfx = crypto.createPrivateKey(pfxData, { passphrase: password });
  const cert = crypto.createCertificate(pfxData);

  return {
    privateKey: pfx.export({ type: 'pkcs8', format: 'pem' }),
    certificate: cert.export({ format: 'pem' })
  };
}

// Obtener argumentos
const pfxFile = process.argv[2];
const password = process.argv[3] || '';

if (!pfxFile) {
  console.log('Uso: node scripts/extract-pfx.js archivo.pfx [contraseña]');
  console.log('');
  console.log('Este script extrae el certificado y la clave privada de un archivo PFX/P12.');
  console.log('Crea archivos cert.pem y key.pem limpios para copiar a Railway.');
  process.exit(1);
}

try {
  console.log(`Leyendo ${pfxFile}...`);

  // Método alternativo usando OpenSSL del sistema si está disponible
  const { execSync } = require('child_process');

  try {
    // Intentar usar openssl si está disponible
    console.log('Intentando usar OpenSSL...');

    // Extraer certificado
    const cert = execSync(`openssl pkcs12 -in "${pfxPath}" -clcerts -nokeys -passin pass:${password}`, { encoding: 'utf8' });
    fs.writeFileSync('cert.pem', cert);
    console.log('✅ Certificado guardado en cert.pem');

    // Extraer clave
    const key = execSync(`openssl pkcs12 -in "${pfxPath}" -nocerts -nodes -passin pass:${password}`, { encoding: 'utf8' });
    fs.writeFileSync('key.pem', key);
    console.log('✅ Clave guardada en key.pem');

    console.log('');
    console.log('Archivos creados correctamente.');
  } catch (opensslError) {
    console.log('OpenSSL no disponible. Intentando método alternativo...');

    // Intentar con Node.js crypto (limitado - no soporta PFX directamente muy bien)
    // Usar una librería sería ideal, pero para mantenerlo simple...

    // Leer el archivo PFX como buffer
    const pfxBuffer = fs.readFileSync(pfxPath);

    // Guardar para referencia
    fs.writeFileSync('pfx-info.txt', `
Tamaño del archivo PFX: ${pfxBuffer.length} bytes
Primeros bytes (hex): ${pfxBuffer.subarray(0, 20).toString('hex')}
    `);

    console.log('⚠️ Node.js crypto no soporta directamente extracción PFX.');
    console.log('');
    console.log('OPCIONES:');
    console.log('1. Instalar Git para Windows (incluye OpenSSL)');
    console.log('2. Instalar OpenSSL para Windows');
    console.log('3. Usar una herramienta online como:');
    console.log('   https://www.sslshopper.com/ssl-converter.html');
    console.log('');
    console.log('Para convertir PFX a PEM:');
    console.log('- Sube tu archivo .pfx');
    console.log('- Selecciona "PEM" como formato de salida');
    console.log('- Descarga el archivo resultante');
    console.log('- Si devuelve un archivo con certificado y clave juntos,');
    console.log('  separa el contenido en dos archivos: cert.pem y key.pem');
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
