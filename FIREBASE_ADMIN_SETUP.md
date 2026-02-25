# Configuración de Firebase Admin SDK en Railway

## Problema

El error 404 en `/api/board` en producción se debe a que Firebase Admin SDK no está configurado correctamente. Cuando esto ocurre, los endpoints fallan al verificar los tokens de autenticación.

## Solución Temporal (Modo Degradado)

Se ha implementado un sistema de fallback que permite que la app funcione incluso si Firebase Admin no está configurado. Los endpoints ahora aceptan el `userId` en el body de la petición como alternativa a la verificación del token.

## Configuración Permanente de Firebase Admin

Para que la autenticación sea segura, necesitas configurar Firebase Admin SDK en Railway:

### 1. Generar Cuenta de Servicio en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `red-agricola-e06cc`
3. Ve a **Configuración del proyecto** (icono de engranaje) → **Cuentas de servicio**
4. Haz clic en **Generar nueva clave privada**
5. Descarga el archivo JSON (tiene un nombre como `red-agricola-e06cc-xxx.json`)

### 2. Extraer los datos del archivo JSON

El archivo descargado tiene este formato:

```json
{
  "type": "service_account",
  "project_id": "red-agricola-e06cc",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxx@red-agricola-e06cc.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 3. Configurar Variables de Entorno en Railway

1. Ve a tu proyecto en [Railway](https://railway.app/)
2. Selecciona tu proyecto
3. Ve a la pestaña **Variables**
4. Añade las siguientes variables:

| Nombre | Valor |
|--------|-------|
| `FIREBASE_PROJECT_ID` | `red-agricola-e06cc` |
| `FIREBASE_CLIENT_EMAIL` | El email del JSON (ej: `firebase-adminsdk-xxx@red-agricola-e06cc.iam.gserviceaccount.com`) |
| `FIREBASE_PRIVATE_KEY` | El contenido de `private_key` del JSON (incluyendo `\n` literales) |

**IMPORTANTE**: Para la clave privada, debes copiarla tal cual aparece en el JSON, incluyendo los `\n` literales (no reemplazarlos por saltos de línea reales).

Ejemplo de cómo debe verse en Railway:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### 4. Redesplegar

Después de añadir las variables, Railway debería redeploy automáticamente. Si no, haz un deploy manual.

### 5. Verificar

Una vez desplegado, puedes verificar que Firebase Admin está configurado correctamente visitando:

```
https://agroredjob.com/api/health
```

Deberías ver algo como:
```json
{
  "status": "ok",
  "timestamp": "2025-02-25T12:00:00.000Z",
  "env": {
    "hasFirebaseProjectId": true,
    "hasFirebaseClientEmail": true,
    "hasFirebasePrivateKey": true,
    "hasDatabaseUrl": true
  }
}
```

Si todas las propiedades son `true`, Firebase Admin está configurado correctamente.

## Notas de Seguridad

- **Nunca** commits el archivo JSON de la cuenta de servicio en el repositorio
- Las variables de entorno en Railway están cifradas
- La cuenta de servicio tiene acceso completo a tu proyecto Firebase, guárdala de forma segura
- El modo degradado (fallback) es solo temporal para desarrollo; en producción deberías tener Firebase Admin configurado
