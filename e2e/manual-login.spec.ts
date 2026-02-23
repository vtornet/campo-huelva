import { test, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

/**
 * Test manual para verificar el login del trabajador
 */
test('Login manual de trabajador', async ({ page }) => {
  console.log('Email:', testUsers.worker.email);
  console.log('Password:', testUsers.worker.password);

  // Ir a login
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Hacer screenshot
  await page.screenshot({ path: 'test-results/login-page.png' });

  // Rellenar formulario
  await page.fill('[data-testid="login-email"]', testUsers.worker.email);
  await page.fill('[data-testid="login-password"]', testUsers.worker.password);

  // Submit
  await page.click('[data-testid="login-submit"]');

  // Esperar navegación
  await page.waitForTimeout(5000);

  // Hacer screenshot
  await page.screenshot({ path: 'test-results/after-login.png' });

  // Verificar URL
  const url = page.url();
  console.log('URL después del login:', url);

  expect(url).not.toContain('login');
});
