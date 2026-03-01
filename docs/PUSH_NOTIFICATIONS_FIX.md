# Solución a las Notificaciones Push - 1 de marzo de 2026

## Problemas encontrados y solucionados:

### 1. ✅ Service Worker no registrado (SOLUCIONADO)

**Problema:** El service worker en `public/sw.js` nunca se registraba, por lo que las notificaciones push no se recibían en ningún dispositivo.

**Solución aplicada:**
- Creado `src/components/ServiceWorkerRegister.tsx` que registra el service worker manualmente
- Añadido al layout principal (`src/app/layout.tsx`)

**Cambios:**
- Nuevo archivo: `src/components/ServiceWorkerRegister.tsx`
- Modificado: `src/app/layout.tsx` (import y uso de ServiceWorkerRegister)

### 2. ⚠️ Claves VAPID no configuradas en Railway (PENDIENTE)

**Problema:** Las claves VAPID necesarias para enviar notificaciones push no están configuradas en las variables de entorno de Railway.

**Solución necesaria:**
Añadir las siguientes variables de entorno en Railway:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8
VAPID_PRIVATE_KEY=l4ngLd36o0Z7yJPPhccdouT6G7V6rY-M94nYy8jK-CU
```

### 3. ✅ Endpoint de diagnóstico creado (NUEVO)

**Solución aplicada:**
- Creado `src/app/api/push/debug/route.ts` para diagnosticar problemas con las notificaciones push

**Uso:**
```
GET /api/push/debug
```

Devuelve:
- Estado de las claves VAPID
- Número de suscripciones activas
- Muestra de suscripciones

## Archivos modificados/creados:

### Archivos creados:
1. `src/components/ServiceWorkerRegister.tsx` - Registra el service worker manualmente
2. `src/app/api/push/debug/route.ts` - Endpoint de diagnóstico
3. `scripts/test-push.js` - Script para probar configuración local
4. `docs/PUSH_NOTIFICATIONS_DEBUG.md` - Documentación de depuración

### Archivos modificados:
1. `src/app/layout.tsx` - Añadido ServiceWorkerRegister
2. `.env.local` - Añadidas claves VAPID
3. `docs/PUSH_NOTIFICATIONS_DEBUG.md` - Documentación actualizada

## Pasos para completar la solución:

### Paso 1: Configurar Railway (CRÍTICO)

1. Ir al proyecto en Railway: https://railway.app/
2. Seleccionar el proyecto "agro-red"
3. Ir a la pestaña "Variables"
4. Añadir las siguientes variables:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8
   VAPID_PRIVATE_KEY=l4ngLd36o0Z7yJPPhccdouT6G7V6rY-M94nYy8jK-CU
   ```
5. Hacer deploy de nuevo

### Paso 2: Verificar en producción

1. Abrir https://agroredjob.com
2. Abrir DevTools → Application → Service Workers
3. Verificar que hay un service worker activo
4. Ir a Perfil → Ajustes
5. Activar "Notificaciones Push"
6. Enviar un mensaje de prueba

### Paso 3: Verificar diagnóstico

Abrir en el navegador:
```
https://agroredjob.com/api/push/debug
```

Debería mostrar:
```json
{
  "timestamp": "2026-03-01T...",
  "vapid": {
    "publicKey": "Configurada",
    "privateKey": "Configurada"
  },
  "subscriptions": {
    "total": 0
  }
}
```

## Flujo completo de notificaciones push:

```
1. Usuario activa notificaciones
   ↓
2. Navegador crea suscripción push
   ↓
3. Suscripción se guarda en BD (PushSubscription)
   ↓
4. Al enviar mensaje → notifyNewMessage()
   ↓
5. sendPushNotification() busca suscripción en BD
   ↓
6. web-push envía notificación al endpoint del usuario
   ↓
7. Service Worker recibe evento "push"
   ↓
8. showNotification() muestra la notificación
```

## Notas importantes:

1. **Las suscripciones existentes dejarán de funcionar** si cambias las claves VAPID. Los usuarios tendrán que volver a activar las notificaciones.

2. **Las claves VAPID deben ser las mismas** en todos los entornos (desarrollo, producción).

3. **El service worker debe estar activo** para recibir notificaciones push.

4. **Las notificaciones push solo funcionan en HTTPS** (o localhost para desarrollo).

5. **Los usuarios deben dar permiso** explícito para recibir notificaciones.
