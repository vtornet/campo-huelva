import { test, expect } from '@playwright/test';
import { loginAsCompany } from './helpers/auth.helpers';
import { urls, selectors, testPost } from './fixtures/test-data';

/**
 * TESTS DE FLUJO DE EMPRESA
 *
 * Estos tests verifican el flujo completo de una empresa:
 * - Publicar oferta de empleo
 * - Ver candidatos inscritos
 * - Filtrar candidatos
 * - Aceptar/rechazar candidatos
 * - Ver trabajadores recomendados
 */

test.describe('Flujo de Empresa', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y localStorage para evitar interferencias
    await page.context().clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    test.skip(!process.env.TEST_COMPANY_EMAIL, 'No hay credenciales de prueba configuradas');
    await loginAsCompany(page);
  });

  test('debe mostrar el dashboard de empresa', async ({ page }) => {
    expect(page.url()).toContain(urls.home);

    // Verificar que hay elementos de empresa visibles
    // (botón de publicar, etc.)
    const publishButton = page.locator(selectors.publishButton);
    await expect(publishButton).toBeVisible();
  });

  test('debe poder acceder a página de publicar oferta', async ({ page }) => {
    await page.goto(urls.publish);

    expect(page.url()).toContain(urls.publish);

    // Verificar que la página carga (puede mostrar selector de tipo primero)
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('debe poder publicar una oferta de empleo', async ({ page }) => {
    await page.goto(urls.publish);

    // Seleccionar tipo Oferta
    const offerButton = page.locator('button:has-text("Oferta"), button:has-text("Ofrecer empleo")');

    if (await offerButton.isVisible()) {
      await offerButton.click();

      // Rellenar formulario
      await page.fill('input[name="title"]', testPost.offer.title);
      await page.selectOption('select[name="province"]', testPost.offer.province);
      await page.fill('input[name="location"]', testPost.offer.location);
      await page.fill('textarea[name="description"]', testPost.offer.description);

      // Campos específicos de oferta
      const contractSelect = page.locator('select[name="contractType"]');
      if (await contractSelect.isVisible()) {
        await contractSelect.selectOption(testPost.offer.contractType);
      }

      // Publicar
      await page.click(selectors.submitButton);

      // Verificar éxito
      const successToast = page.locator('.notification.success, .toast.success');
      await expect(successToast).toBeVisible({ timeout: 5000 });

      // Verificar redirección
      await page.waitForURL(urls.home);
    }
  });

  test('debe poder ver lista de candidatos inscritos', async ({ page }) => {
    await page.goto(urls.applications);

    expect(page.url()).toContain(urls.applications);

    // Verificar que existe la lista de candidatos
    const candidatesList = page.locator('.candidate-card, .application-card');
    await expect(candidatesList).toBeVisible();
  });

  test('debe poder ver perfil completo de candidato', async ({ page }) => {
    await page.goto(urls.applications);

    // Buscar el primer candidato
    const firstCandidate = page.locator('.candidate-card, .application-card').first();

    if (await firstCandidate.isVisible()) {
      // Click para ver detalles
      await firstCandidate.click();

      // Verificar que se abre el modal con detalles
      const modal = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
    } else {
      test.skip(true, 'No hay candidatos inscritos');
    }
  });

  test('debe poder aceptar un candidato', async ({ page }) => {
    await page.goto(urls.applications);

    const firstCandidate = page.locator('.candidate-card').first();

    if (await firstCandidate.isVisible()) {
      // Buscar botón de aceptar
      const acceptButton = firstCandidate.locator('button:has-text("Aceptar")');

      if (await acceptButton.isVisible()) {
        await acceptButton.click();

        // Confirmar si hay diálogo
        const confirmButton = page.locator('button:has-text("Confirmar")');
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Verificar notificación de éxito
        const successToast = page.locator('.notification.success');
        await expect(successToast).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'El candidato ya está aceptado/rechazado');
      }
    } else {
      test.skip(true, 'No hay candidatos inscritos');
    }
  });

  test('debe poder rechazar un candidato', async ({ page }) => {
    await page.goto(urls.applications);

    const firstCandidate = page.locator('.candidate-card').first();

    if (await firstCandidate.isVisible()) {
      const rejectButton = firstCandidate.locator('button:has-text("Rechazar")');

      if (await rejectButton.isVisible()) {
        await rejectButton.click();

        const confirmButton = page.locator('button:has-text("Confirmar")');
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Verificar notificación
        await expect(page.locator('.notification.info, .notification.success')).toBeVisible({ timeout: 5000 });
      } else {
        test.skip(true, 'El candidato ya está rechazado/aceptado');
      }
    } else {
      test.skip(true, 'No hay candidatos inscritos');
    }
  });
});

test.describe('Gestión de Publicaciones (Empresa)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    test.skip(!process.env.TEST_COMPANY_EMAIL, 'No hay credenciales de prueba configuradas');
    await loginAsCompany(page);
  });

  test('debe poder ver mis publicaciones', async ({ page }) => {
    await page.goto(urls.profile);

    // Buscar pestaña de "Mis Publicaciones"
    const myPostsTab = page.locator('button:has-text("Mis Publicaciones"), button:has-text("Publicaciones")');

    if (await myPostsTab.isVisible()) {
      await myPostsTab.click();

      // Verificar que se muestran las publicaciones
      const postsList = page.locator('.post-card');
      await expect(postsList).toBeVisible();
    }
  });

  test('debe poder editar una publicación', async ({ page }) => {
    await page.goto(urls.profile);

    // Ir a Mis Publicaciones
    const myPostsTab = page.locator('button:has-text("Mis Publicaciones")');
    if (await myPostsTab.isVisible()) {
      await myPostsTab.click();

      // Buscar botón de editar en primera publicación
      const editButton = page.locator('.post-card').first().locator('button:has-text("Editar")');

      if (await editButton.isVisible()) {
        await editButton.click();

        // Verificar que navega a /publish con parámetro edit
        await page.waitForURL(/\/publish.*edit=/);

        // Verificar que el formulario está precargado
        await expect(page.locator('input[name="title"]')).not.toHaveValue('');
      }
    }
  });

  test('debe poder eliminar una publicación', async ({ page }) => {
    await page.goto(urls.profile);

    const myPostsTab = page.locator('button:has-text("Mis Publicaciones")');
    if (await myPostsTab.isVisible()) {
      await myPostsTab.click();

      const deleteButton = page.locator('.post-card').first().locator('button:has-text("Eliminar")');

      if (await deleteButton.isVisible()) {
        // Contar publicaciones antes
        const postsBefore = await page.locator('.post-card').count();

        await deleteButton.click();

        // Confirmar eliminación
        const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Eliminar")');
        await confirmButton.click();

        // Esperar que se elimine
        await page.waitForTimeout(1000);

        // Verificar que hay menos publicaciones
        const postsAfter = await page.locator('.post-card').count();
        expect(postsAfter).toBeLessThan(postsBefore);
      }
    }
  });
});
