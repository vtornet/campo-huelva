/**
 * Fixtures de datos de prueba para E2E testing
 *
 * NOTA: Estos datos son solo para testing. En producción, usar variables de entorno
 * o un servicio de usuarios de prueba que se limpien después.
 */

export const testUsers = {
  worker: {
    email: process.env.TEST_WORKER_EMAIL || 'test-worker@example.com',
    password: process.env.TEST_WORKER_PASSWORD || 'Test123456!',
    name: 'Juan Trabajador',
    role: 'WORKER',
  },
  foreman: {
    email: process.env.TEST_FOREMAN_EMAIL || 'test-foreman@example.com',
    password: process.env.TEST_FOREMAN_PASSWORD || 'Test123456!',
    name: 'Pedro Manijero',
    role: 'FOREMAN',
  },
  engineer: {
    email: process.env.TEST_ENGINEER_EMAIL || 'test-engineer@example.com',
    password: process.env.TEST_ENGINEER_PASSWORD || 'Test123456!',
    name: 'Carlos Ingeniero',
    role: 'ENGINEER',
  },
  company: {
    email: process.env.TEST_COMPANY_EMAIL || 'test-company@example.com',
    password: process.env.TEST_COMPANY_PASSWORD || 'Test123456!',
    name: 'Empresa Agrícola Test S.L.',
    companyName: 'Empresa Agrícola Test S.L.',
    role: 'COMPANY',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test123456!',
    name: 'Admin Test',
    role: 'ADMIN',
  },
};

export const testPost = {
  offer: {
    title: 'Recolectores de fresa - Campaña 2026',
    province: 'Huelva',
    location: 'Lepe',
    description: 'Buscamos 20 recolectores de fresa para campaña de primavera. Alojamiento incluido.',
    contractType: 'TEMPORAL',
    salaryAmount: '45',
    salaryPeriod: 'DAILY',
    startDate: '2026-03-01',
    endDate: '2026-06-30',
  },
  demand: {
    title: 'Trabajador disponible para recolección',
    province: 'Huelva',
    location: 'Cartaya',
    description: 'Trabajador con 5 años de experiencia en recolección de fresa y arándanos.',
    taskType: 'Recolección de frutos rojos',
  },
};

export const testProfile = {
  worker: {
    fullName: 'Juan Trabajador Test',
    phone: '+34 600 123 456',
    province: 'Huelva',
    location: 'Moguer',
    hasVehicle: true,
    canRelocate: true,
    yearsOfExperience: 5,
    availableFromDate: '2026-02-23',
    crops: ['Fresa', 'Arándano'],
    tasks: ['Recolección', 'Clasificación'],
    hasFitosanitario: true,
    hasFoodHandler: true,
  },
  company: {
    companyName: 'Empresa Test S.L.',
    cif: 'B12345678',
    address: 'Calle Test, 123',
    province: 'Huelva',
    location: 'Lepe',
    contactPerson: 'Ana Responsable',
    phone: '+34 600 999 888',
    description: 'Empresa dedicada al cultivo de frutos rojos con más de 20 años de experiencia.',
  },
};

/**
 * URLs de la aplicación
 */
export const urls = {
  home: '/',
  login: '/login',
  onboarding: '/onboarding',
  profile: '/profile',
  profileWorker: '/profile/worker',
  profileForeman: '/profile/foreman',
  profileCompany: '/profile/company',
  publish: '/publish',
  applications: '/applications',
  myApplications: '/my-applications',
  messages: '/messages',
  notifications: '/notifications',
  search: '/search',
  admin: '/admin',
};

/**
 * Selectores CSS comunes
 */
export const selectors = {
  // Auth
  loginButton: 'button:has-text("Iniciar sesión")',
  registerButton: 'button:has-text("Regístrate"), a:has-text("Regístrate")',
  googleButton: 'button:has-text("Google"), button:has-text("Continuar con Google")',
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  logoutButton: 'button:has-text("Salir"), button:has-text("Cerrar sesión")',

  // Onboarding
  roleButton: (role: string) => `button:has-text("${role}")`,
  workerRoleButton: 'button:has-text("Busco Trabajo")',
  foremanRoleButton: 'button:has-text("Soy Manijero")',
  companyRoleButton: 'button:has-text("Soy Empresa")',

  // Dashboard
  postCard: '.post-card, article, div[class*="bg-white"][class*="rounded-2xl"]',
  applyButton: 'button:has-text("Inscribirse")',
  withdrawButton: 'button:has-text("Retirarme")',
  appliedButton: 'button:has-text("Inscrito")',
  publishButton: 'button:has-text("Publicar")',
  shareOfferButton: 'button:has-text("Compartir oferta")',

  // Forms
  submitButton: 'button[type="submit"], button:has-text("Guardar"), button:has-text("Publicar")',
  input: (name: string) => `input[name="${name}"]`,
  select: (name: string) => `select[name="${name}"]`,

  // Notifications
  toast: '.notification, .toast',
  successToast: '.notification.success, .toast.success',
  errorToast: '.notification.error, .toast.error',
};
