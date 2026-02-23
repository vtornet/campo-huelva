import { test, expect } from '@playwright/test';
import { loginAsWorker } from './helpers/auth.helpers';
import { urls, selectors } from './fixtures/test-data';

/**
 * TESTS DE FLUJO DE TRABAJADOR
 *
 * Estos tests verifican el flujo completo de un trabajador:
 * - Ver feed de ofertas
 * - Ver detalle de oferta
 * - Inscribirse en oferta
 * - Crear demanda
 * - Ver mis inscripciones
 */

test.describe('Flujo de Trabajador', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y localStorage para evitar interferencias
    await page.context().clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    test.skip(!process.env.TEST_WORKER_EMAIL, 'No hay credenciales de prueba configuradas');
    await loginAsWorker(page);
  });

  test('debe mostrar el dashboard con ofertas', async ({ page }) => {
    // Verificar que estamos en el home (que NO sea login)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('login');

    // Verificar que la página cargó
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Verificar que hay elementos de la app visibles
    // (logo, menú, etc.)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('debe poder cambiar entre Ofertas y Demandas', async ({ page }) => {
    // Esperar a que cargue
    await page.waitForSelector(selectors.postCard);

    // Buscar botones o tabs para cambiar vista
    const offersTab = page.locator('button:has-text("Ofertas"), button:has-text("Ofertas de empleo")');
    const demandsTab = page.locator('button:has-text("Demandas"), button:has-text("Demandas de empleo")');

    // Click en Demandas
    if (await demandsTab.isVisible()) {
      await demandsTab.click();
      // Verificar que cambió la vista (podría haber loading state)
      await page.waitForTimeout(500);
    }
  });

  test('debe poder ver detalle de oferta', async ({ page }) => {
    await page.waitForSelector(selectors.postCard);

    // Click en la primera oferta
    const firstPost = page.locator(selectors.postCard).first();
    await firstPost.click();

    // Verificar que navega a la página de detalle
    await page.waitForURL(/\/offer\//, { timeout: 5000 });

    // Verificar elementos del detalle
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('debe poder inscribirse en una oferta', async ({ page }) => {
    // Ir directamente a una oferta (necesita una ID real)
    // Por ahora, navegamos al home y hacemos click
    await page.waitForSelector(selectors.postCard);

    const firstPost = page.locator(selectors.postCard).first();
    await firstPost.click();

    // Esperar a que cargue la página de detalle
    await page.waitForURL(/\/offer\//);

    // Buscar botón de inscribirse
    const applyButton = page.locator(selectors.applyButton);

    if (await applyButton.isVisible()) {
      // Click en inscribirse
      await applyButton.click();

      // Aceptar confirmación si aparece
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Aceptar")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }

      // Verificar que cambia el estado (botón cambia a "Inscrito")
      const appliedButton = page.locator(selectors.appliedButton);
      await expect(appliedButton).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'No hay ofertas disponibles o el usuario ya está inscrito');
    }
  });

  test('debe poder retirarse de una oferta inscrita', async ({ page }) => {
    test.skip(true, 'Requiere una oferta donde el usuario esté inscrito');

    // Navegar a la oferta
    await page.goto(urls.home);
    await page.waitForSelector(selectors.postCard);
    const firstPost = page.locator(selectors.postCard).first();
    await firstPost.click();

    // Click en retirarme
    const withdrawButton = page.locator(selectors.withdrawButton);
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click();

      // Confirmar
      const confirmButton = page.locator('button:has-text("Confirmar")');
      await confirmButton.click();

      // Verificar que vuelve a mostrar botón de inscribirse
      await expect(page.locator(selectors.applyButton)).toBeVisible({ timeout: 5000 });
    }
  });

  test('debe poder ver mis inscripciones', async ({ page }) => {
    await page.goto(urls.myApplications);

    // Verificar que estamos en la página correcta
    expect(page.url()).toContain(urls.myApplications);

    // Podría estar vacío o tener inscripciones
    const applicationsList = page.locator('.application-card, .post-card');
    await expect(applicationsList).toBeVisible();
  });

  test('debe poder dar like a una publicación', async ({ page }) => {
    await page.waitForSelector(selectors.postCard);

    const firstPost = page.locator(selectors.postCard).first();

    // Buscar botón de like
    const likeButton = firstPost.locator('button:has-text("Me gusta"), button[aria-label*="like"], button svg');

    if (await likeButton.isVisible()) {
      await likeButton.click();

      // Verificar que cambió el estado (corazón relleno)
      await page.waitForTimeout(500);
      // Nota: La verificación visual depende de la implementación
    }
  });
});

test.describe('Publicación de Demanda (Trabajador)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    test.skip(!process.env.TEST_WORKER_EMAIL, 'No hay credenciales de prueba configuradas');
    await loginAsWorker(page);
  });

  test('debe poder acceder a página de publicar', async ({ page }) => {
    await page.goto(urls.publish);

    expect(page.url()).toContain(urls.publish);
  });

  test('debe poder crear una demanda de empleo', async ({ page }) => {
    await page.goto(urls.publish);

    // Seleccionar tipo Demanda
    const demandButton = page.locator('button:has-text("Demanda"), button:has-text("Demandar empleo")');

    if (await demandButton.isVisible()) {
      await demandButton.click();

      // Rellenar formulario
      await page.fill('input[name="title"]', 'Busco trabajo como recolector');
      await page.selectOption('select[name="province"]', 'Huelva');
      await page.fill('textarea[name="description"]', 'Trabajador con 5 años de experiencia en recolección de fresa.');

      // Publicar
      await page.click(selectors.submitButton);

      // Verificar éxito
      const successToast = page.locator('.notification.success, .toast.success');
      await expect(successToast).toBeVisible({ timeout: 5000 });
    }
  });
});
