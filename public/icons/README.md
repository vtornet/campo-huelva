# Iconos PWA para Red Agro

## Instrucciones para generar los iconos

Los iconos deben ser imágenes cuadradas en formato PNG con transparencia.

### Opción 1: Usar herramientas online

1. Ve a [https://realfavicongenerator.net/](https://realfavicongenerator.net/)
2. Sube el logo de Red Agro (el archivo `logo.png` de la carpeta `public/`)
3. Selecciona las opciones:
   - iOS: Yes
   - Android: Yes
   - Windows: No
   - Progressive Web App: Yes
4. Descarga el paquete y extrae los iconos en esta carpeta

### Opción 2: Usar ImageMagick (si está instalado)

```bash
# Convertir logo.png a diferentes tamaños
magick logo.png -resize 72x72 icon-72x72.png
magick logo.png -resize 96x96 icon-96x96.png
magick logo.png -resize 128x128 icon-128x128.png
magick logo.png -resize 144x144 icon-144x144.png
magick logo.png -resize 152x152 icon-152x152.png
magick logo.png -resize 192x192 icon-192x192.png
magick logo.png -resize 384x384 icon-384x384.png
magick logo.png -resize 512x512 icon-512x512.png

# Crear favicon.ico
magick logo.png -resize 32x32 favicon.ico
```

### Opción 3: Usar Node.js con sharp (recomendado)

Instala sharp:
```bash
npm install sharp --save-dev
```

Luego ejecuta el script:
```bash
node scripts/generate-icons.js
```

## Tamaños necesarios

- icon-72x72.png (72x72)
- icon-96x96.png (96x96)
- icon-128x128.png (128x128)
- icon-144x144.png (144x144)
- icon-152x152.png (152x152)
- icon-192x192.png (192x192)
- icon-384x384.png (384x384)
- icon-512x512.png (512x512)

## Características de diseño

- Fondo: Gradiente verde esmeralda (#059669) o transparente
- Logo: Símbolo de planta/trabajador agrícola
- Estilo: Minimalista, reconocible a pequeño tamaño
- Color: Blanco sobre fondo verde para mejor contraste
