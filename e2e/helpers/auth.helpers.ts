import { Page, BrowserContext } from '@playwright/test';
import { testUsers, selectors, urls } from '../fixtures/test-data';

/**
 * Helpers para autenticación y navegación
 */

/**
 * Login en la aplicación con email y contraseña
 */
export async function login(
  page: Page,
  email: string = testUsers.worker.email,
  password: string = testUsers.worker.password,
) {
  // Ir a login si no estamos ahí
  const currentUrl = page.url();
  if (!currentUrl.includes('login')) {
    await page.goto(urls.login);
  }

  // Esperar a que cargue el formulario
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Usar selectores data-testid que son más robustos
  const emailInput = page.locator('[data-testid="login-email"]');
  const passwordInput = page.locator('[data-testid="login-password"]');
  const submitButton = page.locator('[data-testid="login-submit"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  // Esperar a que se complete la navegación
  // Puede ir al home, al perfil, o quedarse en login si hay error
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForTimeout(3000); // Espera adicional para que Firebase establezca la sesión

  // Verificar que no estamos en login
  const finalUrl = page.url();
  if (finalUrl.includes('login')) {
    throw new Error(`Login falló: todavía en ${finalUrl}`);
  }
}

/**
 * Login como trabajador de prueba
 */
export async function loginAsWorker(page: Page) {
  await login(page, testUsers.worker.email, testUsers.worker.password);
}

/**
 * Login como empresa de prueba
 */
export async function loginAsCompany(page: Page) {
  await login(page, testUsers.company.email, testUsers.company.password);
}

/**
 * Login como admin de prueba
 */
export async function loginAsAdmin(page: Page) {
  await login(page, testUsers.admin.email, testUsers.admin.password);
}

/**
 * Logout de la aplicación
 */
export async function logout(page: Page) {
  // Buscar el botón de logout en el menú de perfil
  await page.click('[data-testid="profile-menu"], button:has-text("Perfil")');
  await page.click(selectors.logoutButton);
  await page.waitForURL(urls.login);
}

/**
 * Registrar un nuevo usuario
 * NOTA: Esto requiere Firebase project con auth habilitado
 */
export async function register(
  page: Page,
  email: string,
  password: string,
  role: string,
) {
  await page.goto(urls.login);
  await page.click(selectors.registerButton);

  // Completar formulario de registro
  await page.fill(selectors.emailInput, email);
  await page.fill(selectors.passwordInput, password);

  // Submit registro
  await page.click('button:has-text("Registrarse"), button:has-text("Crear cuenta")');

  // Esperar redirección a onboarding
  await page.waitForURL(urls.onboarding, { timeout: 10000 });

  // Seleccionar rol
  await page.click(selectors.roleButton(role));

  // Redirigido a perfil correspondiente
  await page.waitForLoadState('networkidle');
}

/**
 * Completar perfil de trabajador
 */
export async function completeWorkerProfile(page: Page, profileData?: any) {
  await page.waitForURL(urls.profileWorker);

  // Esperar a que cargue el formulario
  await page.waitForLoadState('networkidle');

  // Rellenar campos obligatorios
  const defaultData = {
    fullName: 'Trabajador Test',
    phone: '+34 600 123 456',
    province: 'Huelva',
    location: 'Moguer',
  };

  const data = { ...defaultData, ...profileData };

  await page.fill('input[name="fullName"]', data.fullName);
  await page.fill('input[name="phone"]', data.phone);

  // Seleccionar provincia
  await page.selectOption('select[name="province"]', data.province);

  // Guardar
  await page.click(selectors.submitButton);

  // Esperar redirección al dashboard
  await page.waitForURL(urls.home, { timeout: 10000 });
}

/**
 * Completar perfil de empresa
 */
export async function completeCompanyProfile(page: Page, profileData?: any) {
  await page.waitForURL(urls.profileCompany);

  const defaultData = {
    companyName: 'Empresa Test S.L.',
    cif: 'B12345678',
    address: 'Calle Test 123',
    province: 'Huelva',
    location: 'Lepe',
    contactPerson: 'Responsable Test',
    phone: '+34 600 999 888',
  };

  const data = { ...defaultData, ...profileData };

  await page.fill('input[name="companyName"]', data.companyName);
  await page.fill('input[name="cif"]', data.cif);
  await page.fill('input[name="address"]', data.address);
  await page.selectOption('select[name="province"]', data.province);
  await page.fill('input[name="contactPerson"]', data.contactPerson);
  await page.fill('input[name="phone"]', data.phone);

  await page.click(selectors.submitButton);
  await page.waitForURL(urls.home, { timeout: 10000 });
}

/**
 * Verificar que el usuario está autenticado
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return !currentUrl.includes('login') && currentUrl !== urls.login;
}

/**
 * Verificar que el usuario NO está autenticado
 */
export async function isNotAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return currentUrl.includes('login') || currentUrl === urls.login;
}

/**
 * Esperar a que aparezca una notificación toast
 */
export async function waitForToast(page: Page, type: 'success' | 'error' = 'success') {
  const selector = type === 'success' ? selectors.successToast : selectors.errorToast;
  await page.waitForSelector(selector, { timeout: 5000 });
}

/**
 * Limpiar cookies y storage (para tests aislados)
 */
export async function clearAuth(context: BrowserContext) {
  await context.clearCookies();
  await context.clearPermissions();
  // También limpiar localStorage si es necesario
  // await page.evaluate(() => localStorage.clear());
}
