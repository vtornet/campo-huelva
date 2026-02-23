import { test, expect, Page } from '@playwright/test';
import { login, loginAsWorker, loginAsCompany, logout, isAuthenticated } from './helpers/auth.helpers';
import { testUsers, urls, selectors } from './fixtures/test-data';

/**
 * TESTS DE AUTENTICACIÓN
 *
 * Estos tests verifican el flujo de login, logout y registro de usuarios.
 */

test.describe('Autenticación', () => {
  // Antes de cada test, limpiar cookies
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('debe mostrar página de login', async ({ page }) => {
    await page.goto(urls.home);

    // Si no está autenticado, debería redirigir a login o mostrar login
    await page.waitForLoadState('networkidle');

    // Verificar que existen elementos de login
    const emailInput = page.locator(selectors.emailInput);
    const passwordInput = page.locator(selectors.passwordInput);
    const loginButton = page.locator(selectors.loginButton);

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
    await page.goto(urls.login);

    await page.fill(selectors.emailInput, 'incorrecto@test.com');
    await page.fill(selectors.passwordInput, 'PasswordIncorrecta123!');

    await page.click(selectors.loginButton);

    // Verificar que aparece mensaje de error
    // Nota: Ajustar selector según la implementación real
    const errorToast = page.locator('.notification.error, .toast.error, [role="alert"]');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
  });

  test('debe redirigir a login si no está autenticado', async ({ page }) => {
    // Intentar acceder a una ruta protegida directamente
    await page.goto(urls.profile);

    // Debería redirigir a login
    await page.waitForURL(urls.login, { timeout: 5000 });
    expect(page.url()).toContain('login');
  });

  test('logout debe redirigir a login', async ({ page }) => {
    // Nota: Este test requiere un usuario de prueba válido en la BD
    // Skip si no hay credenciales de prueba configuradas
    test.skip(!process.env.TEST_WORKER_EMAIL, 'No hay credenciales de prueba configuradas');

    await loginAsWorker(page);

    // Verificar que estamos logueados
    await expect(page.url()).not.toContain('login');

    // Hacer logout
    await logout(page);

    // Verificar que estamos en login
    expect(page.url()).toContain('login');
  });

  test('debe mostrar botón de Google Auth', async ({ page }) => {
    await page.goto(urls.login);

    const googleButton = page.locator(selectors.googleButton);
    await expect(googleButton).toBeVisible();
  });
});

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('debe mostrar selección de rol en onboarding', async ({ page }) => {
    // Nota: Este test requiere estar autenticado sin perfil completo
    test.skip(true, 'Requiere configuración previa de usuario sin perfil');

    await page.goto(urls.onboarding);

    // Verificar que se muestran todos los roles
    await expect(page.locator(selectors.workerRoleButton)).toBeVisible();
    await expect(page.locator(selectors.foremanRoleButton)).toBeVisible();
    await expect(page.locator(selectors.companyRoleButton)).toBeVisible();
  });

  test('seleccionar rol WORKER redirige a perfil de trabajador', async ({ page }) => {
    test.skip(true, 'Requiere configuración previa');

    await page.goto(urls.onboarding);
    await page.click(selectors.workerRoleButton);

    await page.waitForURL(urls.profileWorker);
    expect(page.url()).toContain(urls.profileWorker);
  });

  test('seleccionar rol COMPANY redirige a perfil de empresa', async ({ page }) => {
    test.skip(true, 'Requiere configuración previa');

    await page.goto(urls.onboarding);
    await page.click(selectors.companyRoleButton);

    await page.waitForURL(urls.profileCompany);
    expect(page.url()).toContain(urls.profileCompany);
  });
});
