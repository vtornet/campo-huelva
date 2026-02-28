import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env.test para los tests E2E
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

/**
 * Configuración de Playwright para Agro Red (Campo Huelva)
 *
 * Para ejecutar los tests:
 * - npm run test:e2e           (modo headless)
 * - npm run test:e2e:ui        (modo UI con inspector)
 * - npm run test:e2e:debug     (modo debug)
 * - npm run test:e2e:chrome    (solo Chrome)
 * - npm run test:e2e:mobile    (emulación móvil)
 */
export default defineConfig({
  // Directorio de los tests
  testDir: './e2e',

  // Ejecutar tests en paralelo
  fullyParallel: true,

  // Si un test falla, reintentar 1 vez
  retries: process.env.CI ? 2 : 1,

  // Workers en paralelo - reducido a 1 para evitar interferencias con Firebase
  workers: 1,

  // Reporter: HTML con reporte visual
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  // Configuración global de timeout
  timeout: 30 * 1000, // 30 segundos por test
  expect: {
    timeout: 5 * 1000, // 5 segundos para aserciones
  },

  use: {
    // Base URL de la app
    baseURL: 'http://localhost:3000',

    // Trazas de error (para debugging)
    trace: 'retain-on-failure',

    // Capturas de pantalla cuando falla
    screenshot: 'only-on-failure',

    // Video cuando falla
    video: 'retain-on-failure',

    // Navegador por defecto
    headless: true,

    // Viewport por defecto
    viewport: { width: 1280, height: 720 },
  },

  // Proyectos (configuraciones de prueba)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Tests móviles */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Servidor de desarrollo (opcional, si la app no está corriendo)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
