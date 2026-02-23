import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para completar perfiles de prueba
 *
 * Esta configuración está optimizada para el script de completado de perfiles:
 * - Sin screenshots en cada paso
 * - Sin video
 * - Timeout más largo para interacciones manuales si es necesario
 */

export default defineConfig({
  testDir: './scripts',
  testMatch: '**/complete-test-profiles.spec.ts',

  fullyParallel: false, // Ejecutar uno por uno para evitar conflictos

  retries: 0,

  timeout: 60 * 1000, // 60 segundos por test

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off', // Sin video para este script
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Deshabilitar reportero HTML para este script
  reporter: 'list',
});
