// Script para generar iconos PWA desde el logo principal
// Requiere: npm install sharp

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT_PATH = path.join(__dirname, "../public/logo.png");
const OUTPUT_DIR = path.join(__dirname, "../public/icons");

async function generateIcons() {
  console.log("🎨 Generando iconos PWA para Red Agro...\n");

  // Crear directorio si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Verificar que existe el logo de entrada
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("❌ Error: No se encuentra el archivo logo.png en public/");
    console.log("   Coloca un archivo logo.png en la carpeta public/ y ejecuta este script de nuevo.");
    process.exit(1);
  }

  try {
    // Procesar cada tamaño
    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      console.log(`   Generando ${size}x${size}...`);

      // Redimensionar con fondo circular para mejor apariencia
      await sharp(INPUT_PATH)
        .resize(size, size, {
          fit: "cover",
          position: "center",
        })
        .png()
        .toFile(outputPath);
    }

    // Generar favicon.ico (32x32)
    console.log("   Generando favicon.ico...");
    await sharp(INPUT_PATH)
      .resize(32, 32, { fit: "cover", position: "center" })
      .png()
      .toFile(path.join(__dirname, "../public/favicon.ico"));

    console.log("\n✅ Iconos generados correctamente!");
    console.log(`📁 Ubicación: ${OUTPUT_DIR}`);
    console.log("\nIconos generados:");
    SIZES.forEach((size) => console.log(`   - icon-${size}x${size}.png`));
    console.log("   - favicon.ico");
  } catch (error) {
    console.error("❌ Error al generar iconos:", error.message);
    process.exit(1);
  }
}

generateIcons();
