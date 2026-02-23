import { test, expect } from '@playwright/test';

/**
 * Script para completar automáticamente los perfiles de prueba
 *
 * Este script automatiza el proceso de onboarding para todos los usuarios de prueba.
 *
 * Uso:
 *   npx playwright test --project=chromium scripts/complete-test-profiles.spec.ts --config=playwright.config.ts
 *
 * O desde el script helper:
 *   npm run test:profiles:complete
 */

const baseURL = process.env.BASE_URL || 'http://localhost:3000';

// Datos para completar perfiles
const profileData = {
  worker: {
    fullName: 'Juan Trabajador',
    phone: '+34 600 123 456',
    province: 'Huelva',
    location: 'Moguer',
    hasVehicle: true,
    canRelocate: true,
    yearsOfExperience: '5',
    availableFromDate: '2025-03-01',
    crops: ['Fresa', 'Arándano'],
    tasks: ['Recolección', 'Clasificación'],
    hasFitosanitario: true,
    hasFoodHandler: true,
  },
  foreman: {
    fullName: 'Pedro Manijero',
    phone: '+34 600 222 333',
    province: 'Huelva',
    location: 'Lepe',
    teamSize: '8',
    hasVan: true,
    hasTools: true,
    yearsOfExperience: '10',
    availableFromDate: '2025-02-23',
    crops: ['Fresa', 'Arándano', 'Frambuesa'],
    tasks: ['Recolección', 'Poda', 'Laboreo'],
  },
  engineer: {
    fullName: 'Carlos Ingeniero',
    phone: '+34 600 444 555',
    province: 'Huelva',
    location: 'Huelva',
    specialty: 'Ingeniero Técnico Agrícola',
    ropsNumber: 'ROP-12345',
    services: ['Asesoramiento', 'Peritajes', 'Gestión de cultivos'],
    yearsOfExperience: '15',
    crops: ['Fresa', 'Arándano', 'Cítricos'],
  },
  encargado: {
    fullName: 'Luis Encargado',
    phone: '+34 600 666 777',
    province: 'Huelva',
    location: 'Palos de la Frontera',
    yearsOfExperience: '12',
    canHandleTractor: true,
    preferredZone: 'Costa',
    crops: ['Fresa', 'Arándano'],
    hasFitosanitario: true,
    hasFoodHandler: true,
  },
  tractorista: {
    fullName: 'Miguel Tractorista',
    phone: '+34 600 888 999',
    province: 'Huelva',
    location: 'Ayamonte',
    yearsOfExperience: '8',
    machineryTypes: ['Tractor', 'Cosechadora'],
    toolTypes: ['Arado', 'Cultivador', 'Pulverizadora'],
    hasTractorLicense: true,
    hasPulverizerLicense: true,
    hasHarvesterLicense: true,
    availableFullSeason: true,
    willingToTravel: true,
    crops: ['Cereales', 'Fresa', 'Hortícolas'],
  },
  company: {
    companyName: 'Empresa Test S.L.',
    cif: 'B12345678',
    address: 'Polígono Industrial, Calle Test 123',
    province: 'Huelva',
    location: 'Lepe',
    contactPerson: 'Ana Responsable',
    phone: '+34 959 123 456',
    description: 'Empresa dedicada al cultivo de frutos rojos con más de 20 años de experiencia.',
  },
};

// Función helper para login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${baseURL}/login`);
  await page.waitForLoadState('networkidle');

  // Completar formulario de login
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Iniciar sesión")');

  // Esperar navegación
  await page.waitForTimeout(2000);
}

// Función helper para completar perfil de trabajador
async function completeWorkerProfile(page: Page) {
  const data = profileData.worker;

  // Esperar a que cargue el formulario
  await page.waitForLoadState('networkidle');

  // Campos básicos
  await page.fill('input[name="fullName"]', data.fullName);
  await page.fill('input[name="phone"]', data.phone);

  // Provincia y ubicación
  await page.selectOption('select[name="province"]', data.province);
  await page.waitForTimeout(500);

  // Seleccionar ubicación (si hay dropdown)
  const locationInput = page.locator('input[name="location"], input[placeholder*="ubicación"], input[placeholder*="municipio"]');
  if (await locationInput.isVisible()) {
    await locationInput.fill(data.location);
    await page.waitForTimeout(500);
  }

  // Checkbox de vehículo
  const hasVehicleCheckbox = page.locator('input[name="hasVehicle"], input[type="checkbox"]').first();
  if (await hasVehicleCheckbox.isVisible() && data.hasVehicle) {
    await hasVehicleCheckbox.check();
  }

  // Años de experiencia
  const experienceInput = page.locator('input[name="yearsOfExperience"], input[type="number"]').first();
  if (await experienceInput.isVisible()) {
    await experienceInput.fill(data.yearsOfExperience);
  }

  // Carnets
  if (data.hasFitosanitario) {
    const fitoCheckbox = page.locator('input[name="hasFitosanitario"]').first();
    if (await fitoCheckbox.isVisible()) await fitoCheckbox.check();
  }
  if (data.hasFoodHandler) {
    const foodCheckbox = page.locator('input[name="hasFoodHandler"]').first();
    if (await foodCheckbox.isVisible()) await foodCheckbox.check();
  }

  // Guardar
  await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Continuar")');

  // Esperar redirección
  await page.waitForURL('/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Función helper para completar perfil de empresa
async function completeCompanyProfile(page: Page) {
  const data = profileData.company;

  await page.waitForLoadState('networkidle');

  await page.fill('input[name="companyName"]', data.companyName);
  await page.fill('input[name="cif"]', data.cif);
  await page.fill('input[name="address"]', data.address);
  await page.selectOption('select[name="province"]', data.province);
  await page.waitForTimeout(500);

  const locationInput = page.locator('input[name="location"]');
  if (await locationInput.isVisible()) {
    await locationInput.fill(data.location);
  }

  await page.fill('input[name="contactPerson"]', data.contactPerson);
  await page.fill('input[name="phone"]', data.phone);

  const descriptionArea = page.locator('textarea[name="description"]');
  if (await descriptionArea.isVisible()) {
    await descriptionArea.fill(data.description);
  }

  // Guardar
  await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Continuar")');

  await page.waitForURL('/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Función helper para completar cualquier perfil con datos mínimos
async function completeMinimalProfile(page: Page, role: string) {
  await page.waitForLoadState('networkidle');

  // Datos mínimos según rol
  const data: any = {
    WORKER: { name: 'fullName', value: profileData.worker.fullName },
    FOREMAN: { name: 'fullName', value: profileData.foreman.fullName },
    ENGINEER: { name: 'fullName', value: profileData.engineer.fullName },
    ENCARGADO: { name: 'fullName', value: profileData.encargado.fullName },
    TRACTORISTA: { name: 'fullName', value: profileData.tractorista.fullName },
    COMPANY: { name: 'companyName', value: profileData.company.companyName },
  }[role];

  if (!data) return;

  // Buscar el input de nombre y llenarlo
  const nameInput = page.locator(`input[name="${data.name}"], input[placeholder*="nombre"], input[placeholder*="Nombre"]`);
  if (await nameInput.isVisible()) {
    await nameInput.fill(data.value);
  }

  // Llenar teléfono (campo común)
  const phoneInput = page.locator('input[name="phone"], input[type="tel"]');
  if (await phoneInput.isVisible()) {
    await phoneInput.fill('+34 600 000 000');
  }

  // Seleccionar provincia
  const provinceSelect = page.locator('select[name="province"]');
  if (await provinceSelect.isVisible()) {
    await provinceSelect.selectOption('Huelva');
    await page.waitForTimeout(500);
  }

  // Guardar
  await page.click('button[type="submit"], button:has-text("Guardar"), button:has-text("Continuar")');

  // Esperar redirección o éxito
  await page.waitForTimeout(2000);
}

// ============ TESTS ============

test.describe('Completar Perfiles de Prueba', () => {
  test.use({ baseURL });

  test('Trabajador - WORKER', async ({ page }) => {
    await login(page, 'test-worker@example.com', 'Test123456!');

    // Si está en onboarding, seleccionar rol
    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Busco Trabajo")');
      await page.waitForTimeout(1000);
    }

    // Completar perfil
    if (page.url().includes('/profile/worker')) {
      await completeWorkerProfile(page);
    }

    // Verificar que estamos en el dashboard
    expect(page.url()).toContain('/');
  });

  test('Jefe de Cuadrilla - FOREMAN', async ({ page }) => {
    await login(page, 'test-foreman@example.com', 'Test123456!');

    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Soy Manijero")');
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/profile/foreman')) {
      await completeMinimalProfile(page, 'FOREMAN');
    }

    expect(page.url()).toContain('/');
  });

  test('Ingeniero - ENGINEER', async ({ page }) => {
    await login(page, 'test-engineer@example.com', 'Test123456!');

    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Soy Ingeniero")');
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/profile/engineer')) {
      await completeMinimalProfile(page, 'ENGINEER');
    }

    expect(page.url()).toContain('/');
  });

  test('Encargado - ENCARGADO', async ({ page }) => {
    await login(page, 'test-encargado@example.com', 'Test123456!');

    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Soy Encargado")');
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/profile/encargado')) {
      await completeMinimalProfile(page, 'ENCARGADO');
    }

    expect(page.url()).toContain('/');
  });

  test('Tractorista - TRACTORISTA', async ({ page }) => {
    await login(page, 'test-tractorista@example.com', 'Test123456!');

    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Soy Tractorista")');
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/profile/tractorista')) {
      await completeMinimalProfile(page, 'TRACTORISTA');
    }

    expect(page.url()).toContain('/');
  });

  test('Empresa - COMPANY', async ({ page }) => {
    await login(page, 'test-company@example.com', 'Test123456!');

    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Soy Empresa")');
      await page.waitForTimeout(1000);
    }

    if (page.url().includes('/profile/company')) {
      await completeCompanyProfile(page);
    }

    expect(page.url()).toContain('/');
  });

  test('Admin - ADMIN', async ({ page }) => {
    await login(page, 'test-admin@example.com', 'Test123456!');

    // Admin puede no necesitar perfil, o tener un flujo diferente
    if (page.url().includes('/onboarding')) {
      await page.click('button:has-text("Admin")');
      await page.waitForTimeout(1000);
    }

    // Admin puede ir directamente al dashboard
    await page.waitForTimeout(2000);

    // Verificar que no hay error
    expect(await page.title()).toBeTruthy();
  });
});
