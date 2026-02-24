# Configuración de Firebase Admin SDK

## ¿Qué es Firebase Admin SDK?

Firebase Admin SDK permite verificar tokens de autenticación en el servidor, proporcionando una capa adicional de seguridad. Con él, podemos:

1. **Verificar que el token de Firebase ID es válido** - No falsificado
2. **Comprobar que el token no ha expirado**
3. **Validar que el token no ha sido revocado** (ej: usuario baneado)
4. **Obtener el UID real del usuario** desde el token verificado

## Por qué es importante

Sin verificación de tokens en el servidor, cualquiera podría hacer peticiones con un `userId` arbitrario y suplantar a otro usuario. Con Firebase Admin SDK, cada petición debe incluir un token válido que solo el usuario real puede obtener.

## Configuración

### Paso 1: Generar una cuenta de servicio

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (icono de engranaje)
4. En la pestaña **Service accounts**, haz clic en **Generate new private key**
5. Guarda el archivo JSON de forma segura (¡no lo commits en Git!)

### Paso 2: Configurar las variables de entorno

El archivo JSON descargado contiene algo como:

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@tu-proyecto.iam.gserviceaccount.com",
  ...
}
```

Necesitas agregar estos valores a tu archivo `.env`:

```bash
# Firebase Admin SDK (para verificación de tokens en servidor)
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Nota importante**: La `private_key` debe incluir los caracteres `\n` literales o usar comillas dobles para que bash interprete las nuevas líneas correctamente.

### Paso 3: Verificar la configuración

Una vez configuradas las variables de entorno, puedes verificar que Firebase Admin SDK está funcionando correctamente:

```typescript
import { isFirebaseAdminConfigured, initFirebaseAdmin } from "@/lib/firebase-admin";

// En un endpoint de prueba
export async function GET() {
  const isConfigured = isFirebaseAdminConfigured();
  const auth = initFirebaseAdmin();

  return Response.json({
    configured: isConfigured,
    authInitialized: !!auth
  });
}
```

## Migración de endpoints

### Antes (sin verificación de token)

```typescript
// El cliente envía el userId en el body
const response = await fetch("/api/posts/123/apply", {
  method: "POST",
  body: JSON.stringify({ userId: user.uid, ... })
});
```

```typescript
// El servidor confía en el userId recibido
export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  // ... usa userId directamente
}
```

### Después (con verificación de token)

```typescript
// El cliente incluye el token en el header Authorization
import { apiFetch } from "@/lib/api-client";

const response = await apiFetch("/api/posts/123/apply", {
  method: "POST",
  body: JSON.stringify({ /* ya no necesita userId */ })
});
```

```typescript
// El servidor verifica el token
import { authenticateRequest } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const userId = await authenticateRequest(request);
    // ... userId está verificado
  } catch (error) {
    return Response.json({ error: error.message }, { status: 401 });
  }
}
```

## Compatibilidad durante la transición

El código actual mantiene compatibilidad con ambos métodos:

```typescript
// Función auxiliar que permite ambos métodos
async function getUserId(request: Request, body?: any): Promise<string> {
  try {
    // Primero intentar verificar el token (recomendado)
    return await authenticateRequest(request);
  } catch (authError) {
    // Fallback al userId del body (deprecated)
    if (body?.userId) {
      console.warn("⚠️ Usando autenticación por body (deprecated)");
      return body.userId;
    }
    throw new Error("Usuario no autenticado");
  }
}
```

## Plan de migración

1. **Fase 1**: Configurar Firebase Admin SDK en producción
2. **Fase 2**: Actualizar clientes críticos para usar `apiFetch` en lugar de `fetch`
3. **Fase 3**: Eliminar el fallback de userId en body
4. **Fase 4**: Aplicar a todos los endpoints sensibles

## Variables de entorno necesarias

Añadir a `.env` y `.env.example`:

```bash
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_email=firebase-adminsdk-xxx@tu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Seguridad

- **Nunca hacer commit** del archivo JSON de la cuenta de servicio
- **Nunca exponer** la private key en el código del cliente
- **Rotar la clave** si se compromete
- **Usar diferentes claves** para desarrollo y producción
