# E2E Testing con Playwright

Esta carpeta contiene los tests End-to-End para la aplicación Agro Red (Campo Huelva).

## 🚀 Uso Rápido

```bash
# 1. Crear usuarios de prueba en Firebase
npm run test:users:create

# 2. Completar perfiles de los usuarios (automatizado)
npm run test:profiles:complete

# 3. Ejecutar tests (requiere servidor corriendo)
npm run test:e2e:ui
```

## 📋 Configuración Inicial (Primera Vez)

### Paso 1: Crear Usuarios de Prueba

```bash
# Asegúrate de tener el servidor corriendo
npm run dev

# En otra terminal, crea los usuarios
npm run test:users:create
```

Esto creará 7 usuarios de prueba en Firebase:
- test-worker@example.com (WORKER)
- test-foreman@example.com (FOREMAN)
- test-engineer@example.com (ENGINEER)
- test-encargado@example.com (ENCARGADO)
- test-tractorista@example.com (TRACTORISTA)
- test-company@example.com (COMPANY)
- test-admin@example.com (ADMIN)

**Contraseña para todos:** `Test123456!`

### Paso 2: Completar Perfiles Automáticamente

```bash
# Esto completará el onboarding para todos los usuarios
npm run test:profiles:complete
```

### Paso 3: Ejecutar Tests

```bash
# Con interfaz visual (recomendado)
npm run test:e2e:ui

# Modo headless
npm run test:e2e

# Solo en Chrome
npm run test:e2e:chrome

# Tests móviles
npm run test:e2e:mobile

# Ver reporte HTML
npm run test:e2e:report
```

## 📁 Estructura

## 📁 Estructura

```
e2e/
├── fixtures/
│   └── test-data.ts       # Datos de prueba, URLs, selectores
├── helpers/
│   └── auth.helpers.ts    # Helpers para autenticación
├── auth.spec.ts           # Tests de login/registro
├── worker.spec.ts         # Tests de flujo de trabajador
├── company.spec.ts        # Tests de flujo de empresa
└── pwa.spec.ts            # Tests de PWA
```

## 🧪 Tests Disponibles

### auth.spec.ts - Autenticación
- Login con credenciales correctas/incorrectas
- Redirección a login sin autenticación
- Logout
- Selección de rol en onboarding

### worker.spec.ts - Trabajador
- Ver dashboard y feed de ofertas
- Cambiar entre Ofertas/Demandas
- Ver detalle de oferta
- Inscribirse en oferta
- Retirar inscripción
- Ver mis inscripciones
- Crear demanda de empleo

### company.spec.ts - Empresa
- Ver dashboard de empresa
- Publicar oferta de empleo
- Ver lista de candidatos inscritos
- Ver perfil completo de candidato
- Aceptar/rechazar candidatos
- Ver mis publicaciones
- Editar/Eliminar publicaciones

### pwa.spec.ts - PWA
- Manifest válido
- Service Worker registrado
- Meta tags PWA
- Funcionamiento offline
- Responsive en móvil
- Performance básica

## 🎯 Crear Nuevos Tests

```typescript
import { test, expect } from '@playwright/test';
import { loginAsWorker } from './helpers/auth.helpers';
import { urls, selectors } from './fixtures/test-data';

test.describe('Mi Nuevo Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await loginAsWorker(page);
  });

  test('mi test case', async ({ page }) => {
    // Tu código de test aquí
    await page.goto(urls.home);
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🔍 Debugging

Para debugging visual, usa el modo UI:

```bash
npm run test:e2e:ui
```

Características del modo UI:
- Time travel: ve el estado de la app en cada paso
- Inspeccionar selectores
- Re-ejecutar tests individualmente
- Ver network activity

Para debugging paso a paso:

```bash
npm run test:e2e:debug
```

Luego usa `page.pause()` en tu código:

```typescript
test('ejemplo', async ({ page }) => {
  await page.goto('/');
  page.pause(); // El inspector se abrirá aquí
  await page.click('button');
});
```

## 📊 Reportes

Después de ejecutar los tests, se genera un reporte HTML en `playwright-report/`:

```bash
npm run test:e2e:report
```

El reporte incluye:
- ✅/❌ Estado de cada test
- Screenshots de fallos
- Videos de ejecución
- Trace de errores

## 🔄 CI/CD

Para ejecutar en GitHub Actions o similar:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 📝 Notas Importantes

1. **Tests con skip:** Muchos tests están marcados como `test.skip()` porque requieren:
   - Usuarios de prueba configurados
   - Datos específicos en la base de datos
   - Configuración de Firebase

2. **Selectores:** Los selectores en `test-data.ts` pueden necesitar ajustes según la implementación real de la UI.

3. **Timeouts:** Los timeouts están configurados para apps en desarrollo. En entornos CI puede ser necesario aumentarlos.

4. **Datos de prueba:** Los tests pueden afectar datos reales si se ejecutan contra producción. **Siempre usar un entorno de testing.**
