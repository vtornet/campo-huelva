# MEMORY - Campo Huelva / Agro Red

## Lecciones Aprendidas

### Service Worker y Google Auth (03/03/2026)

**Problema:** Google Auth (`signInWithPopup`) fallaba en Chrome móvil cuando el Service Worker estaba activo.

**Causa raíz:** Los Service Workers que interceptan peticiones de red (`fetch` event) interfieren con los popups de autenticación de terceros en Chrome móvil, incluso cuando se usan `return` sin `event.respondWith()`.

**Solución:** Service Worker minimalista SIN `fetch` handler.

```javascript
// ❌ NO hacer esto en el Service Worker:
self.addEventListener("fetch", (event) => {
  // Cualquier código aquí, incluso return; sin event.respondWith()
  // causa problemas con Google Auth en móvil
});

// ✅ Service Worker mínimo:
// - Solo install/activate básicos
// - Solo manejar push notifications
// - NO tener fetch handler
```

**Trade-off:** Se pierde el caché offline, pero Google Auth funciona correctamente.

**Archivo:** `public/sw.js` debe mantenerse minimalista.

---

## Reglas de Oro

1. **NO tocar lo que funciona** sin probar exhaustivamente
2. **Google Auth es frágil** con Service Workers - cualquier intercepción de fetch puede romperlo
3. **Chrome móvil es más estricto** que desktop con políticas de seguridad
