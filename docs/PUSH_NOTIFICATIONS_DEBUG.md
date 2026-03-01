# Depuración de Notificaciones Push

## Fecha: 1 de marzo de 2026

## Resumen de problemas encontrados y soluciones aplicadas:

### 1. ❌ Claves VAPID no configuradas en Railway

**Problema:** Las claves VAPID necesarias para las notificaciones push no están configuradas en las variables de entorno de Railway.

**Solución aplicada:** Añadir las siguientes variables de entorno en Railway:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8
VAPID_PRIVATE_KEY=l4ngLd36o0Z7yJPPhccdouT6G7V6rY-M94nYy8jK-CU
```

**Estado:** ⚠️ Pendiente de configurar en Railway

### 2. ❌ Service Worker no registrado

**Problema:** El service worker en `public/sw.js` no se estaba registrando automáticamente. No había código que lo registrara, por lo que las notificaciones push nunca se recibían.

**Solución aplicada:** Creado `src/components/ServiceWorkerRegister.tsx` que registra el service worker manualmente y añadido al layout principal.

**Código:**
```tsx
// src/components/ServiceWorkerRegister.tsx
navigator.serviceWorker.register("/sw.js", { scope: "/" })
```

**Estado:** ✅ Solucionado en código

### 3. ⚠️ Claves VAPID diferentes entre archivos

**Problema:** Las claves VAPID necesarias para las notificaciones push no están configuradas en las variables de entorno de Railway.

**Solución:** Añadir las siguientes variables de entorno en Railway:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8
VAPID_PRIVATE_KEY=l4ngLd36o0Z7yJPPhccdouT6G7V6rY-M94nYy8jK-CU
```

### 2. ⚠️ Claves VAPID diferentes entre archivos

**Problema:** El archivo `.env` tiene claves VAPID diferentes a `.env.local`:
- `.env`: `BMxhIjsYstPdjgcaQox6guYZjNoYM5FLs15GtyDeS0M3XsiVv8vgGoJc1xHaTFwfKcBAz9mnXg6osppzdIeoLn0`
- `.env.local`: `BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8`

**Importante:** Si las claves cambian, las suscripciones existentes dejarán de funcionar y los usuarios tendrán que volver a suscribirse.

### 3. ⚠️ Service Worker no confirmado

**Problema:** No está confirmado que el service worker (`public/sw.js`) se esté registrando correctamente en producción.

**Verificación:**
- Abrir la aplicación en producción
- Abrir DevTools → Application → Service Workers
- Verificar que hay un service worker activo
- Verificar que tiene el event listener para "push"

## Pasos para solucionar:

### Paso 1: Configurar Railway

1. Ir al proyecto en Railway
2. Ir a la pestaña "Variables"
3. Añadir las variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPKrLwkq5I0anG4W_-mE0-_2cfcqXeLMjcyzurz3GwRBIp5H0kIJgbjWNubD4T_SLUmmxUAjor_RfHPt2tIbRR8`
   - `VAPID_PRIVATE_KEY=l4ngLd36o0Z7yJPPhccdouT6G7V6rY-M94nYy8jK-CU`
4. Hacer deploy de nuevo

### Paso 2: Verificar diagnóstico

Usar el endpoint de diagnóstico:
```
GET /api/push/debug
```

Este endpoint devuelve:
- Estado de las claves VAPID
- Número de suscripciones activas
- Muestra de suscripciones

### Paso 3: Probar notificación push

Una vez configurado Railway, probar enviando una notificación:

```bash
curl -X POST https://agroredjob.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_DE_PRUEBA",
    "title": "Prueba de push",
    "body": "Esto es una prueba",
    "url": "/"
  }'
```

### Paso 4: Verificar en el navegador

1. Abrir la aplicación
2. Ir a Perfil → Ajustes
3. Activar "Notificaciones Push"
4. Enviar un mensaje de prueba
5. Verificar que la notificación aparece

## Flujo completo de notificaciones push:

1. **Usuario activa notificaciones:**
   - Usuario hace clic en "Activar" en ajustes
   - Navegador solicita permiso
   - Si concedido, se crea suscripción push
   - Suscripción se envía a `/api/push/subscribe`
   - Se guarda en BD (tabla `PushSubscription`)

2. **Se envía un mensaje:**
   - Endpoint `/api/messages` POST
   - Llama a `notifyNewMessage()`
   - Llama a `sendPushNotification()`
   - Busca suscripción del usuario en BD
   - Envía notificación via `web-push`

3. **Service Worker recibe push:**
   - Evento `push` en `public/sw.js`
   - Muestra notificación con `self.registration.showNotification()`
   - Usuario ve notificación en su dispositivo

## Errores comunes:

| Error | Causa | Solución |
|-------|-------|----------|
| `VAPID keys no configuradas` | Variables de entorno no definidas | Añadir `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` |
| `Usuario no tiene suscripción push` | Usuario no ha activado notificaciones | Usuario debe activar en ajustes |
| `410 Gone` | Suscripción inválida/expirada | Usuario debe volver a suscribirse |
| `403 Forbidden` | Claves VAPID incorrectas | Verificar que coinciden cliente/servidor |

## Herramientas de depuración:

1. **Endpoint de diagnóstico:** `/api/push/debug`
2. **Service Worker:** DevTools → Application → Service Workers
3. **Push Notifications:** DevTools → Application → Push Notifications
4. **Logs de servidor:** Railway → Logs
