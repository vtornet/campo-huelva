# CLAUDE.md - Guía del Proyecto Agro Red / Campo Huelva

Este archivo proporciona orientación a Claude Code (o cualquier desarrollador) que trabaje en este repositorio. Contiene tanto las directrices técnicas como la visión estratégica del producto.

## Descripción General del Proyecto

**Agro Red (nombre técnico: Campo Huelva)** es una plataforma de empleo agrícola que conecta a trabajadores, jefes de cuadrilla (manijeros), ingenieros y empresas del sector agrario español. Es una mezcla de Infojobs y red social vertical, construida como una PWA (Progressive Web App) para garantizar el acceso desde cualquier dispositivo móvil, incluso en zonas con baja cobertura.

El proyecto nace de un grupo de Facebook con más de **34.000 usuarios activos en Huelva**, lo que proporciona una validación real y una tracción inicial inigualable.

### Visión de Producto
Construir una red profesional y de empleo fiable, centrada exclusivamente en el sector agrícola español, priorizando:
- Ofertas y demandas de empleo reales.
- Perfiles de usuario verificados y adaptados a cada rol (trabajador, jefe de cuadrilla, ingeniero, empresa).
- La figura del **jefe de cuadrilla** como elemento diferencial (equipos completos y formados, con un responsable único).
- Confianza y transparencia entre todas las partes.
- Simplicidad y usabilidad por encima de funciones sociales genéricas.
- Escalabilidad para convertirse en la herramienta de referencia a nivel nacional.

**Diferenciador clave**: El fundador tiene una dilatada experiencia como director de zona en importantes ETT del sector agroalimentario. Este conocimiento profundo de la legislación, las necesidades reales y los puntos de dolor del sector es el verdadero producto. Agro Red **no es una ETT ni una empresa de servicios**, sino un marketplace de conexión que respeta la legalidad (pago directo, convenios colectivos) y empodera a los profesionales del campo.

## Estado del Proyecto

Proyecto en desarrollo activo. Aún no se garantiza compatibilidad con versiones anteriores, pero cualquier cambio importante debe discutirse previamente.

**Despliegue**: Railway con dominio propio https://agroredjob.com

**Última actualización**: 26 de febrero de 2026

## Comandos de Desarrollo

# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint

# Operaciones de Base de Datos (tras cambios en schema.prisma)
npx prisma generate
npx prisma db push

# Forzar migración con pérdida de datos (cuando se eliminan columnas)
npx prisma db push --accept-data-loss

# Tests E2E con Playwright
npm run test:e2e           # Ejecutar todos (headless)
npm run test:e2e:ui        # Interfaz visual (recomendado)
npm run test:e2e:chrome    # Solo Chromium
npm run test:e2e:mobile    # Emulación móvil
npm run test:e2e:report    # Ver reporte HTML

# Scripts de datos de prueba
npm run test:users:create  # Crear usuarios en Firebase
npm run test:profiles:complete  # Completar onboarding
npm run test:seed          # Sembrar datos (posts, inscripciones)

## Arquitectura Técnica

### Sistema de Autenticación Dual
La aplicación utiliza **Firebase Auth** para la autenticación en el frontend y **PostgreSQL (via Prisma)** para los datos persistentes de usuario.
- El UID de Firebase (`user.uid`) es la clave primaria en la base de datos.
- **Firebase**: Gestiona el estado de autenticación (inicio/cierre de sesión) a través de `src/lib/firebase.ts`.
- **Prisma/PostgreSQL**: Almacena perfiles de usuario, publicaciones, solicitudes y conexiones.
- **Sincronización**: Cuando los usuarios se registran mediante `/api/register`, su UID de Firebase se almacena como `User.id` en Prisma.

### Roles de Usuario
Definidos en `prisma/schema.prisma`:
- **USER** (Trabajador/Peón): Busca empleo individualmente.
- **FOREMAN** (Manijero): Líder de cuadrilla, ofrece un equipo completo y formado.
- **ENGINEER** (Ingeniero Técnico Agrícola): Asesoramiento, peritajes, gestión de cultivos.
- **COMPANY** (Empresa): Contrata trabajadores o cuadrillas.
- **ENCARGADO** (Capataz/Encargado): Responsable de finca, experiencia en cultivos y manejo de tractor.
- **TRACTORISTA** (Tractorista): Especialista en maquinaria agrícola y aperos.

Cada rol tiene una tabla de perfil dedicada: `WorkerProfile`, `ForemanProfile`, `EngineerProfile`, `CompanyProfile`, `EncargadoProfile`, `TractoristProfile`.

### Modelos de Datos Clave

**Sistema de Publicaciones**:
- `PostType.OFFICIAL`: Ofertas verificadas publicadas por empresas (de pago).
- `PostType.SHARED`: Ofertas externas compartidas por usuarios (en revisión).
- `PostType.DEMAND`: Demandas de empleo publicadas por trabajadores o jefes de cuadrilla.

**Perfiles Detallados**:
- **Trabajador**: Datos personales, vehículo, disponibilidad, carnets (fitosanitario, manipulador de alimentos), experiencia por cultivos y tareas, años de campaña.
- **Jefe de cuadrilla**: Todo lo anterior + número de componentes de la cuadrilla, disponibilidad de furgoneta/herramientas.
- **Ingeniero**: Datos técnicos, especialidad, número ROPO/colegiado, experiencia en cultivos, servicios ofrecidos.
- **Empresa**: Datos fiscales, y tras verificación manual, acceso a publicación de ofertas y BBDD.

**Sistema de Inscripciones (Applications)**:
- Los trabajadores se inscriben en ofertas.
- Al inscribirse, **autorizan automáticamente** que la empresa vea sus datos de contacto (teléfono, email).
- Las empresas pueden ver todos los datos de contacto de los inscritos.
- Estados: PENDING, ACCEPTED, REJECTED, CONTACTED, WITHDRAWN.

## Estructura de la Aplicación (App Router)

- `src/app/`
  - `page.tsx`: Dashboard principal con feed filtrable por provincia y tipo de publicación.
  - `login/`: Autenticación con Firebase.
  - `onboarding/`: Selección de rol para nuevos usuarios.
  - `profile/worker/`, `profile/foreman/`, `profile/engineer/`, `profile/company/`, `profile/encargado/`, `profile/tractorista/`: Formularios de edición de perfil.
  - `publish/`: Creación de publicaciones con selección de tipo.
  - `applications/`: Gestión de candidatos para empresas (ver perfiles completos, datos de contacto).
  - `my-applications/`: Lista de inscripciones del trabajador.
- `src/app/api/`
  - `register/`: Crea el usuario en Prisma a partir de la autenticación de Firebase.
  - `user/me/`: Devuelve los datos del usuario con resolución de perfil.
  - `posts/`: Obtiene el feed (GET) y crea publicaciones (POST).
  - `posts/[id]/apply`: Inscribirse en una oferta (POST), ver inscritos (GET), retirarse (DELETE).
  - `applications/[id]`: Actualizar estado de inscripción (PUT).
  - `applications/`: Listar inscripciones del usuario (GET).
- `src/context/AuthContext.tsx`: Provee el estado de autenticación mediante el hook `useAuth()`.
- `src/lib/constants.ts`: Listas de provincias, tipos de cultivo, municipios de Huelva, etc.

### Patrones Importantes

- **Comprobación de Perfil Completo**: En `page.tsx`, los usuarios son redirigidos a onboarding si su perfil carece de nombre (`fullName` o `companyName`).
- **Asociación de Autor en Publicaciones**:
  - Empresas → `companyId` + tipo OFFICIAL.
  - Trabajadores/Jefes de cuadrilla → `publisherId` + tipo SHARED o DEMAND.
- **Código de Colores por Rol**:
  - Trabajadores: Tema verde (`bg-green-*`, `text-green-*`)
  - Jefes de cuadrilla: Tema naranja (`bg-orange-*`, `text-orange-*`)
  - Empresas: Tema azul

### Variables de Entorno Requeridas

**Para Firebase (públicas):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Para la Base de Datos (privadas):**
- `DATABASE_URL`: Cadena de conexión a PostgreSQL (Railway).

## Tareas Pendientes (Orden de Prioridad)

### ✅ 1. PWA / Instalación (COMPLETADO)
- [x] Manifest.json completo con nombre, iconos, colores
- [x] Service Worker para modo offline
- [x] Iconos de la app en múltiples tamaños (72, 96, 128, 144, 152, 192, 384, 512)
- [x] Meta tags PWA (apple-touch-icon, theme-color, mobile-web-app-capable)
- [x] Estrategia de caché para contenido estático y API
- [x] Probado en escritorio y móvil - instalación funcional

### ✅ 2. Nuevos Perfiles de Usuario (COMPLETADO)
- [x] **Encargado/Capataz**: Nuevo rol con perfil específico
  - Experiencia en cultivos específicos
  - Capacidad de manejo de tractor
  - Zona de trabajo preferente
  - Carnets fitosanitarios y manipulador de alimentos
- [x] **Tractorista**: Nuevo rol con perfil específico
  - Tipos de maquinaria que maneja
  - Tipos de aperos que utiliza
  - Carnets específicos (tractor, pulverizadora, cosechadora)
  - Experiencia por cultivo
  - Disponibilidad para temporada completa y viajes

### ✅ 3. Buscador de Candidatos por Categoría (COMPLETADO)
- [x] Nueva página `/search` con selector inicial de perfil:
  - Peón/Trabajador
  - Tractorista
  - Manijero
  - Encargado
  - Ingeniero
- [x] Según selección, mostrar filtros específicos de esa categoría
- [x] Resultados con cards de candidato y opción de contacto
- [x] Modal de perfil completo con todos los datos del candidato
- [x] Filtros corregidos (fitosanitario case-insensitive, especialidades de manijero)

### ✅ 4. Gestión de Publicaciones para Todos los Usuarios (COMPLETADO)
- [x] **Pestaña "Mis Publicaciones" integrada en `/profile`**
  - Ver todas las publicaciones propias
  - Editar publicaciones (redirige a `/publish?edit=id`)
  - Eliminar publicaciones permanentemente
  - Botones de acción directa desde la lista
- [x] **API actualizada**
  - PUT en `/api/posts/[id]` para editar
  - DELETE en `/api/posts/[id]` para eliminar/archivar
  - Incluir conteo de aplicaciones en respuesta
- [x] **Redirecciones actualizadas** de `/publish` a `/profile` tras guardar/editar

### ✅ 5. Filtros Avanzados en Gestión de Candidatos (COMPLETADO)
- [x] Filtros en `/applications` para empresas:
  - Por experiencia (años de campaña) - slider de 0 a 20+ años
  - Por disponibilidad de vehículo propio
  - Por carnet de manipulador de alimentos
  - Por carnets fitosanitarios
  - Por disponibilidad de reubicación
  - Por provincia (se genera dinámicamente según candidatos)
- [x] Ordenamiento por múltiples criterios (fecha, experiencia, nombre)
- [x] Guardar filtros preferidos (localStorage)
- [x] Panel de filtros colapsable con contador de filtros activos
- [x] Mensaje de "sin resultados" cuando los filtros no coinciden

### ✅ 6. SEO y Meta Tags (COMPLETADO)
- [x] Títulos dinámicos por página (`<title>`, `<meta name="description">`) - configurado en layout.tsx con template
- [x] Open Graph para compartir en redes (og:title, og:description, og:image) - imagen generada dinámicamente
- [x] Twitter Cards - imagen generada dinámicamente
- [x] Favicon en múltiples formatos - iconos en 72, 96, 128, 144, 152, 192, 384, 512px
- [x] Sitemap.xml - sitemap.ts con rutas estáticas y preparado para dinámicas
- [x] Robots.txt - robots.ts con reglas para crawlers

### ✅ 7. Optimizaciones de Producción (COMPLETADO)
- [x] Compresión de imágenes (next/image con AVIF/WebP)
- [x] Configuración de imágenes Next.js (remotePatterns para Firebase Storage y dominio propio)
- [x] Optimización de bundles (dynamic imports para RecommendedOffers en dashboard)
- [x] Headers de seguridad mejorados (CSP, X-Frame-Options, etc.)
- [x] Cache headers para assets estáticos (iconos, manifest, favicon)
- [x] Variables de entorno de producción configuradas (NEXT_PUBLIC_APP_URL)
- [x] Logging optimizado para producción

### 8. Internacionalización (i18n)
- [ ] **Soporte multiidioma para temporeros extranjeros**
  - Español (idioma principal/predeterminado)
  - Francés (temporeros de origen magrebí)
  - Rumano (temporeros rumanos, muy comunes en la fresa)
  - Inglés (idioma universal)
- [ ] Sistema de traducción:
  - Integrar `next-intl` o similar
  - Archivos de traducción por idioma (JSON)
  - Selector de idioma en la app con persistencia en preferencias de usuario
- [ ] Traducción de:
  - Interfaz de usuario (labels, botones, mensajes)
  - Textos de onboarding por rol
  - Errores y notificaciones
  - Emails (si aplica)
  - Política de privacidad y términos legales
- [ ] Detección automática de idioma del navegador
- [ ] URLs localizadas (/es, /fr, /ro, /en) o subdominios

### ✅ 9. Validaciones y UX Final (COMPLETADO)
- [x] Validaciones básicas en formularios (required, minLength, etc.)
- [x] Mensajes de error más amigables (reemplazados alerts en publish/page.tsx)
- [x] Estados de carga en todas las operaciones async (loading states)
- [x] Pantallas de error personalizadas (404 not-found.tsx, 500 error.tsx)
- [x] Componentes de Skeleton reutilizables (Skeleton.tsx con PostCardSkeleton, ProfileSkeleton, etc.)
- [x] **Validaciones avanzadas** (teléfono +34, email, CIF/NIF/NIE)
  - Módulo `src/lib/validations.ts` con validaciones RGPD
  - Componente `PhoneInput` aplicado a 6 perfiles de usuario

### ✅ 10. Componentes de UI Reutilizables (COMPLETADO)
- [x] **ConfirmDialog** (`src/components/ConfirmDialog.tsx`): Modal de confirmación para reemplazar `window.confirm()`
  - Hook `useConfirmDialog()` para fácil integración
  - 4 tipos visuales: danger, warning, info, success
  - Texto personalizable para botones
- [x] **PromptDialog** (`src/components/PromptDialog.tsx`): Modal de entrada de texto para reemplazar `window.prompt()`
  - Hook `usePromptDialog()` para fácil integración
  - Soporta input de una línea o textarea (multiline)
  - Validación de campo requerido
- [x] **Notifications** (`src/components/Notifications.tsx`): Sistema de notificaciones toast
  - Context `NotificationsProvider` y hook `useNotifications()`
  - 4 tipos: success, error, warning, info
  - Auto-dismiss con timeout configurable
- [x] **Skeleton** (`src/components/Skeleton.tsx`): Componentes de loading
  - PostCardSkeleton, ProfileSkeleton, etc.
- [x] **MultiSelectDropdown**: Dropdown de selección múltiple con búsqueda
- [x] **AIButton**, **AIBioGenerator**, **AIImprovedTextarea**: Componentes para funcionalidades IA

### ✅ 11. Eliminación de Alerts Nativos (COMPLETADO)
- [x] Todos los `window.alert()`, `window.confirm()` y `window.prompt()` reemplazados por componentes personalizados
- [x] Integración en:
  - `src/app/admin/page.tsx` (baneos, silencios, cambios de rol)
  - `src/app/page.tsx` (inscripciones, retiros)
  - `src/app/my-applications/page.tsx` (retirar inscripción)
  - `src/app/profile/page.tsx` (eliminar publicación)
  - `src/components/PostActions.tsx` (denuncias)
  - `src/components/AIImprovedTextarea.tsx` (mejora con IA)

### ✅ 12. Restricciones de Publicación por Rol (COMPLETADO)
- [x] **Solo ADMIN puede publicar ofertas SHARED** (compartidas)
  - Verificación en `/api/posts/route.ts`
  - Botón "Compartir oferta" solo visible para admin en página principal
  - Etiqueta "⚡ Oferta compartida" con estilo indigo
- [x] **Solo COMPANY puede publicar ofertas OFICIALES**
  - Verificación de aprobación de empresa requerida
- [x] **Otros roles solo pueden publicar DEMANDAS**
- [x] **Ofertas compartidas sin botones de acción** (no inscribirse/contactar)

### ✅ 13. Corrección de Rol ADMIN (COMPLETADO)
- [x] El rol ADMIN ahora se respeta correctamente en `/api/user/me/route.ts`
  - Antes: El rol se sobrescribía si el admin tenía un perfil asociado (workerProfile, etc.)
  - Ahora: El rol ADMIN siempre se mantiene, independientemente de los perfiles asociados
- [x] Botón "Compartir oferta" visible para administradores

### ✅ 14. Página de Detalle de Oferta Mejorada (COMPLETADO)
- [x] Botón "Inscribirse" funcionando en `/offer/[id]/page.tsx`
  - Estados visuales: Inscribirse → Inscrito → Aceptado/Rechazado/Contactado
  - Confirmación antes de inscribirse (autoriza compartir datos de contacto)
  - Posibilidad de retirar inscripción
- [x] Botón "Contactar" para demandas y empresas
- [x] Ofertas compartidas (SHARED) sin botón de acción

### ✅ 15. Ofertas Recomendadas por IA (COMPLETADO)
- [x] Al pulsar una oferta recomendada, navega a la página de detalle
  - Antes: Iniciaba un chat directamente
  - Ahora: Abre `/offer/[id]` para ver detalles completos e inscribirse

### ✅ 16. Seguridad (COMPLETADO)
- [x] Headers de seguridad (CSP, X-Frame-Options, HSTS implementados en next.config.ts)
- [x] CSP actualizado para Google Auth (`apis.google.com` en script-src)
- [x] CSP actualizado para Firebase iframe (`red-agricola-e06cc.firebaseapp.com` en frame-src)
- [x] HSTS (Strict-Transport-Security) configurado
- [x] CORS configurado (next.config.ts permite oríenes externos limitados)
- [x] Sanitización básica de inputs (Next.js sanitiza por defecto en JSX)
- [x] **Verificación de tokens de Firebase en servidor** (módulo `src/lib/firebase-admin.ts`)
- [x] **Rate limiting en endpoints sensibles** (módulo `src/lib/rate-limit.ts`)
  - Inscripciones: 20 por minuto
  - Mensajes: 10 por minuto
  - Denuncias: 5 por minuto
- [x] **Middleware de autenticación centralizado** (función `authenticateRequest`)
- [x] **Cliente HTTP para peticiones autenticadas** (`src/lib/api-client.ts`)

**Nota**: Se ha implementado Firebase Admin SDK para verificación de tokens en servidor. Los endpoints de inscripciones, mensajes y denuncias ahora incluyen rate limiting. Durante la transición, se mantiene compatibilidad con el método anterior (userId en body) pero se recomienda migrar al uso de Authorization header.

### ✅ 17. Testing E2E con Playwright (COMPLETADO)
- [x] **Infraestructura de testing completa**
  - Playwright configurado con soporte multi-browser (Chromium, Firefox, WebKit, Mobile)
  - Tests organizados por funcionalidad (auth, worker, company, pwa)
  - Helpers de autenticación reutilizables
  - Scripts automáticos para crear usuarios, perfiles y datos de prueba
- [x] **Tests implementados: 27/39 pasando (69%)**
  - Autenticación: 5/5 ✅ (login, redirección, errores, Google Auth, logout)
  - PWA: 10/10 ✅ (manifest, service worker, meta tags, responsive, performance)
  - Onboarding: 3/3 ✅ (selección de rol, redirecciones)
  - Empresa: 6/9 (dashboard, publicar, editar, eliminar, aceptar/rechazar)
  - Trabajador: 5/7 (dashboard, feed, like, publicar demanda)
- [x] **Scripts de datos de prueba**
  - `scripts/create-test-users-simple.js` - Crear usuarios en Firebase
  - `scripts/complete-profiles-direct.js` - Crear perfiles en Prisma
  - `scripts/seed-test-data.js` - Crear posts de prueba
- [x] **Documentación generada**
  - `E2E_IMPLEMENTATION_SUMMARY.md` - Resumen de implementación
  - `E2E_TEST_RESULTS_FINAL.md` - Resultados detallados
- [ ] **Tests pendientes de completar** (requieren datos específicos o ajustes menores)
  - Ver detalle de oferta (requiere click en post)
  - Inscribirse en oferta (requiere click en post y botón)
  - Ver mis inscripciones (ajuste de navegación)
  - Ver lista de candidatos inscritos (requiere datos en BD)
- [ ] Probar en dispositivos móviles reales (Android e iOS)
- [ ] Probar en diferentes navegadores (Chrome, Safari, Firefox)
- [ ] Probar en modo offline (PWA ya implementada)

### ✅ 18. Legal / Comunicación (COMPLETADO - 25/02/2026)
- [x] **Documentos legales RGPD compliant**
  - Política de Privacidad (`/privacy`) - Responsable: Víctor José Tornet García, Appstracta
  - Términos y Condiciones (`/terms`)
  - Política de Cookies (`/cookies`)
  - Aviso Legal (`/legal`) - Datos: NIF 77534989B, Lepe (Huelva)
  - Registro de Actividades de Tratamiento (RAT) interno - `docs/RAT_INTERNO.md`
- [x] **Footer global** (`src/components/Footer.tsx`) con enlaces a todos los documentos legales
- [x] **Casillas de aceptación en registro** (`src/components/LegalCheckboxes.tsx`)
  - Checkbox obligatorios: Privacidad, Términos, Edad mínima (16+)
  - Checkbox opcional: Comunicaciones comerciales
  - Validación antes de registro (email y Google Auth)

### ✅ 19. Carnet de Carretillero (COMPLETADO - 28/02/2026)
- [x] Campo `hasForkliftLicense` añadido en schema de WorkerProfile
- [x] Checkbox en formulario de perfil de trabajador
- [x] Filtro en búsqueda de candidatos
- [x] Badge en tarjetas de resultados y modal de perfil

### ⏸️ 20. Verificación de Empresas con AEAT (DIFERIDO)
- [ ] Verificación automática de empresas mediante CIF a través de API de AEAT
- [ ] Uso de certificado electrónico para autenticación con AEAT
- [ ] **Estado**: En desarrollo. Se intentó implementar el 24/02/2026 pero quedó pendiente por problemas con la configuración del certificado electrónico.
- [ ] **Nota**: Dejar para más adelante. Actualmente la verificación de empresas es manual.

### ✅ 20. Tablón Social (COMPLETADO - 25/02/2026)
- [x] Nueva pestaña "Tablón" junto a "Ofertas" y "Demandas"
- [x] Publicaciones tipo red social (compartir coche, buscar compañeros, etc.)
- [x] Aviso al crear publicación: no se permiten ofertas/demandas de empleo
- [x] Solo usuarios no empresas pueden publicar (trabajadores, manijeros, ingenieros, encargados, tractoristas)
- [x] Botones en publicaciones: Like, Compartir, Denunciar, Contactar, Comentar
- [x] Comentarios anidados con respuestas
- [x] Botones en comentarios: Like, Responder, Denunciar
- [x] Respuestas a comentarios también con Like y Denunciar
- [x] **Botón Contactar crea conversación directamente** (sin mensaje automático)
- [x] Endpoint `/api/messages/find-or-create` para reutilizar conversaciones existentes

### ✅ 21. Eliminación de Mensajes Automáticos (COMPLETADO - 25/02/2026)
- [x] **Eliminados todos los mensajes iniciales automáticos** al contactar
- [x] Antes: Al contactar se enviaba "Hola, me interesa tu publicación..."
- [x] Ahora: Se crea/navega a la conversación vacía para que el usuario escriba su propio mensaje
- [x] Afecta a:
  - Tablón social (`BoardPostCard.tsx`)
  - Feed principal (`page.tsx`)
  - Detalle de oferta (`offer/[id]/page.tsx`)
  - Candidatos recomendados (`RecommendedWorkers.tsx`)
- [x] Endpoint `/api/messages/find-or-create` para reutilizar conversaciones existentes

### ✅ 22. Validaciones de Formularios (COMPLETADO - 25/02/2026)
- [x] **Módulo de validaciones centralizado** (`src/lib/validations.ts`)
  - `validatePhone()`: Formato español +34 XXX XXX XXX
  - `formatPhone()`: Formateo automático
  - `validateEmail()`: Validación robusta de email
  - `validateTaxId()`: CIF/NIF/NIE con algoritmo oficial
  - `formatTaxId()`: Formateo B-12345678 o B 12345678 0
  - `validatePostalCode()`: 5 dígitos, 01-52
  - Mensajes de error en español (`validationErrors`)
- [x] **Componente PhoneInput** (`src/components/PhoneInput.tsx`)
  - Validación en tiempo real (blur)
  - Iconos de estado (✓/✗)
  - Formateo automático
  - Compatible con todos los perfiles
- [x] **Aplicado a 6 perfiles de usuario**:
  - Trabajador (`profile/worker/page.tsx`)
  - Jefe de cuadrilla (`profile/foreman/page.tsx`)
  - Ingeniero (`profile/engineer/page.tsx`)
  - Encargado (`profile/encargado/page.tsx`)
  - Tractorista (`profile/tractorista/page.tsx`)
  - Empresa (`profile/company/page.tsx`)

---

## 🎯 Roadmap a Fase Beta

El proyecto está en un estado avanzado. A continuación se detallan las tareas pendientes **ordenadas por prioridad** para llegar a fase Beta:

### ✅ COMPLETADOS (Bloqueantes resueltos)

#### 1. ✅ Legal y Cumplimiento Normativo (COMPLETADO)
- [x] **Política de Privacidad** (RGPD compliant)
- [x] **Términos y Condiciones de uso**
- [x] **Política de Cookies**
- [x] **Aviso Legal**
- [x] **Registro de Actividades de Tratamiento (RAT)** interno
- [x] **Casillas de aceptación** en registro
- [x] **Política de privacidad actualizada para empresas** (texto profesional sobre datos de contacto)

#### 2. ✅ Validaciones de Formularios (COMPLETADO)
- [x] Validación de teléfono (formato español +34 XXX XXX XXX)
- [x] Validación de email (robusta)
- [x] Validación de CIF/NIF/NIE para empresas
- [x] Componente PhoneInput aplicado a 6 perfiles

#### 3. ✅ Banner de Cookies (COMPLETADO - 25/02/2026)
- [x] Banner de cookies con botones "Aceptar", "Rechazar" y "Configurar"
- [x] Modal de configuración lateral con toggles para cada categoría
- [x] Persistencia de consentimiento en localStorage
- [x] Panel en página /cookies para ver estado actual y cambiar preferencias
- [x] Contexto CookieProvider con hook useCookies()
- [x] Sistema de versiones para futuros cambios
- [x] Cookies necesarias siempre activas (Firebase Auth, sesión)
- [x] Categorías opcionales: Analíticas, Marketing

#### 4. ✅ Página de Contacto/Soporte (COMPLETADO - 25/02/2026)
- [x] Formulario de contacto (nombre, email, asunto, mensaje)
- [x] Validaciones en tiempo real con mensajes de error
- [x] Rate limiting (5 mensajes por hora) para prevenir spam
- [x] Email de soporte visible (contact@appstracta.app)
- [x] Política de respuesta: máximo 48 horas
- [x] Información de ubicación y horario
- [x] Nota legal RGPD sobre tratamiento de datos
- [x] Enlace desde Footer

#### 5. ✅ Perfiles Mejorados (COMPLETADO - 26/02/2026)
- [x] **Worker**: Herramientas manuales (desbrozadora, motosierra, etc.) y experiencia en almacén
- [x] **Foreman**: Carnet de manipulador de alimentos
- [x] **Encargado**: Experiencia en almacén (checkbox), transformación de fincas, Office, informes
- [x] **Encargado**: Texto corregido "Disponibilidad para alojarse en finca"
- [x] **Layouts corregidos**: flex-wrap para evitar desbordamiento de textos largos
- [x] **Opción "Otros"** añadida en todas las listas de selección (cultivos, herramientas, etc.)

#### 6. ✅ Buscador Actualizado (COMPLETADO - 28/02/2026)
- [x] Filtros para herramientas manuales y experiencia en almacén (worker)
- [x] Filtro de carnet manipulador (manijero)
- [x] Filtro de carnet de carretillero (worker)
- [x] Filtros para experiencia en almacén y habilidades de gestión (encargado)
- [x] Badges en tarjetas de resultados y modal de perfil completo

### ✅ TODOS LOS BLOQUEANTES PARA BETA COMPLETADOS

---

## 🎉 ESTADO ACTUAL: LISTO PARA FASE BETA

Todos los requisitos obligatorios para lanzar la fase Beta han sido completados:
- ✅ Legal y Cumplimiento Normativo (RGPD)
- ✅ Validaciones de Formularios
- ✅ Banner de Cookies
- ✅ Página de Contacto/Soporte
- ✅ Perfiles mejorados con herramientas, almacén y opción "Otros"

### ✅ 1. Sistema de Contactos (COMPLETADO - 28/02/2026)
> **Restringir mensajería para mejorar privacidad y reducir spam**

- [x] **Modelo de datos en Prisma**: Tabla `Contact` con status (PENDING, ACCEPTED)
- [x] **Botón "Añadir como contacto"** (`AddContactButton`):
  - En publicaciones del TABLÓN
  - En resultados del buscador
  - Restringido para empresas (no pueden añadir contactos)
- [x] **Gestión de solicitudes de contacto**:
  - Panel de solicitudes pendientes en `/profile/contacts`
  - Opciones: Aceptar, Rechazar
- [x] **Pestaña "Contactos" en el perfil** (`/profile/contacts`):
  - Lista de contactos aceptados
  - Ver perfil completo, enviar mensaje, eliminar contacto
- [x] **API endpoints implementados**:
  - `POST /api/contacts` - Enviar solicitud de contacto
  - `GET /api/contacts` - Listar contactos (con filtro ?requests=true)
  - `PUT /api/contacts/[id]/accept` - Aceptar solicitud
  - `DELETE /api/contacts/[id]` - Eliminar contacto/rechazar solicitud

**PENDIENTE**: Restricción de mensajería - actualmente NO se verifica relación de contacto antes de enviar mensajes

### 🟡 IMPORTANTES (Recomendados para Beta)

#### 2. Testing en Dispositivos Reales
> **Asegurar que funciona en el entorno real del usuario**

- [ ] Probar PWA en Android (Chrome)
- [ ] Probar PWA en iOS (Safari)
- [ ] Probar instalación desde home screen
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Probar con conexión lenta/intermitente

#### 3. Mejoras de UX en Chat
> **La experiencia de mensajería debe ser fluida**

- [ ] Indicador de "escribiendo..."
- [ ] Confirmación de lectura (✓✓)
- [ ] Carga de imágenes en el chat
- [ ] Envío de ubicación
- [ ] Búsqueda en el historial de mensajes

#### 4. Gestión de Denuncias (Admin)
> **Panel para moderar contenido reportado**

- [ ] Panel de denuncias pendientes
- [ ] Vista detallada de publicación/comentario denunciado
- [ ] Acciones: ignorar, ocultar contenido, sancionar usuario
- [ ] Historial de denuncias por usuario
- [ ] Estadísticas de denuncias

#### 5. Sistema de Notificaciones Push
> **Los usuarios necesitan saber cuando hay actividad relevante**

- [ ] Notificación de nuevos mensajes
- [ ] Notificación de inscripciones en ofertas (para empresas)
- [ ] Notificación de cambios de estado (aceptado/rechazado)
- [ ] Notificación de nuevas ofertas según perfil
- [ ] Gestión de preferencias de notificación
- [ ] Configuración de navegador para permisos

### 🟢 DESEABLES (Posponer si es necesario)

#### 6. Internacionalización (i18n)
> **Temporeros extranjeros necesitan la app en su idioma**

- [ ] Integrar `next-intl`
- [ ] Traducir interfaz a Francés, Rumano, Inglés
- [ ] Selector de idioma persistente
- [ ] Detección automática de idioma

#### 7. Perfil de Empresa Mejorado
> **Más información para evaluar a las empresas**

- [ ] Galería de fotos (instalaciones, cultivos)
- [ ] Descripción extendida de la empresa
- [ ] Valoraciones de trabajadores (cuando haya reputación)
- [ ] Historial de ofertas publicadas

#### 8. Dashboard de Analytics
> **Métricas para entender el uso de la plataforma**

- [ ] Usuarios activos diarios/semanales/mensuales
- [ ] Ofertas publicadas vs. cubiertas
- [ ] Tiempo medio de contratación
- [ ] Roles más activos
- [ ] Provincias con más actividad

### 🔵 DIFERIDOS (Post-Beta)

- Verificación automática de empresas con AEAT
- Sistema de reputación/valoraciones
- Matchmaking inteligente avanzado
- Modelo de monetización (pagos)
- Video llamadas integradas
- Integración con redes sociales (login adicional)
- Geolocalización de ofertas (mapa interactivo)

---

## 🎉 ESTADO ACTUAL: LISTO PARA FASE BETA

Todos los requisitos obligatorios para lanzar la fase Beta han sido completados:
- ✅ Legal y Cumplimiento Normativo (RGPD)
- ✅ Validaciones de Formularios
- ✅ Banner de Cookies
- ✅ Página de Contacto/Soporte
- ✅ Perfiles mejorados con herramientas, almacén y opción "Otros"
- ✅ Sistema de Contactos (modelo de datos, API y UI implementados)
- ✅ Carnet de carretillero en perfil y buscador

**PENDIENTE**: Restringir mensajería para verificar relación de contacto antes de enviar mensajes (excepto empresas).

### 🟡 IMPORTANTES (Recomendados para Beta)

#### 5. Sistema de Notificaciones Push
> **Los usuarios necesitan saber cuando hay actividad relevante**

- [ ] Notificación de nuevos mensajes
- [ ] Notificación de inscripciones en ofertas (para empresas)
- [ ] Notificación de cambios de estado (aceptado/rechazado)
- [ ] Notificación de nuevas ofertas según perfil
- [ ] Gestión de preferencias de notificación
- [ ] Configuración de navegador para permisos

#### 6. Testing en Dispositivos Reales
> **Asegurar que funciona en el entorno real del usuario**

- [ ] Probar PWA en Android (Chrome)
- [ ] Probar PWA en iOS (Safari)
- [ ] Probar instalación desde home screen
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Probar con conexión lenta/intermitente

#### 7. Mejoras de UX en Chat
> **La experiencia de mensajería debe ser fluida**

- [ ] Indicador de "escribiendo..."
- [ ] Confirmación de lectura (✓✓)
- [ ] Carga de imágenes en el chat
- [ ] Envío de ubicación
- [ ] Búsqueda en el historial de mensajes

#### 8. Gestión de Denuncias (Admin)
> **Panel para moderar contenido reportado**

- [ ] Panel de denuncias pendientes
- [ ] Vista detallada de publicación/comentario denunciado
- [ ] Acciones: ignorar, ocultar contenido, sancionar usuario
- [ ] Historial de denuncias por usuario
- [ ] Estadísticas de denuncias

### 🟢 DESEABLES (Posponer si es necesario)

#### 9. Internacionalización (i18n)
> **Temporeros extranjeros necesitan la app en su idioma**

- [ ] Integrar `next-intl`
- [ ] Traducir interfaz a Francés, Rumano, Inglés
- [ ] Selector de idioma persistente
- [ ] Detección automática de idioma

#### 10. Perfil de Empresa Mejorado
> **Más información para evaluar a las empresas**

- [ ] Galería de fotos (instalaciones, cultivos)
- [ ] Descripción extendida de la empresa
- [ ] Valoraciones de trabajadores (cuando haya reputación)
- [ ] Historial de ofertas publicadas

#### 11. Dashboard de Analytics
> **Métricas para entender el uso de la plataforma**

- [ ] Usuarios activos diarios/semanales/mensuales
- [ ] Ofertas publicadas vs. cubiertas
- [ ] Tiempo medio de contratación
- [ ] Roles más activos
- [ ] Provincias con más actividad

### 🔵 DIFERIDOS (Post-Beta)

- Verificación automática de empresas con AEAT
- Sistema de reputación/valoraciones
- Matchmaking inteligente avanzado
- Modelo de monetización (pagos)
- Video llamadas integradas
- Integración con redes sociales (login adicional)
- Geolocalización de ofertas (mapa interactivo)

## Funcionalidades Ya Implementadas

### Legal y Cumplimiento (RGPD)
- Documentos legales completos (Privacidad, Términos, Cookies, Aviso Legal)
- Registro de Actividades de Tratamiento (RAT) interno
- Footer global con enlaces a documentos
- Casillas de aceptación en registro (obligatorias + opcional)
- Validaciones de datos (teléfono, email, CIF/NIF/NIE)

### Validaciones de Formularios
- Módulo centralizado de validaciones (`src/lib/validations.ts`)
- Validación de teléfono español (+34 XXX XXX XXX)
- Validación de email robusta
- Validación de CIF/NIF/NIE con algoritmo oficial
- Componente PhoneInput aplicado a 6 perfiles de usuario

### Autenticación y Usuarios
- Registro con Firebase (email/contraseña y Google)
- Onboarding con selección de rol
- Perfiles detallados por rol (trabajador, manijero, ingeniero, empresa, encargado, tractorista)
- Verificación manual de empresas (etiqueta "Empresa Verificada")
- Sistema de roles y permisos
- Rol ADMIN con privilegios especiales

### Publicaciones y Feed
- Feed con filtros por provincia y tipo de publicación
- Publicación de ofertas (empresas OFICIALES, admin SHARED)
- Publicación de demandas (trabajadores/manijeros)
- Etiquetas visuales: "Empresa verificada", "⚡ Oferta compartida", "Demanda"
- Sistema de "Like", "Compartir", "Denunciar"
- Recomendaciones de ofertas por IA para trabajadores
- Gestión de publicaciones propias (ver, editar, eliminar)

### Inscripciones y Contacto
- Sistema de inscripciones en ofertas con confirmación
- Estados: PENDIENTE, ACEPTADO, RECHAZADO, CONTACTADO
- Autorización explícita para compartir datos de contacto al inscribirse
- Retiro de inscripciones
- Chat/mensajería interna entre usuarios
- Notificaciones a empresas cuando alguien se inscribe
- **Contacto sin mensajes automáticos**: Al pulsar "Contactar" se crea/navega a conversación vacía

### Interfaz y UX
- Modales personalizados (ConfirmDialog, PromptDialog) - sin alerts nativos
- Sistema de notificaciones toast
- Componentes de carga (Skeleton)
- Pantallas de error personalizadas (404, 500)
- Diseño responsive (móvil y escritorio)
- Dynamic imports para optimizar bundle

### IA y Recomendaciones
- Mejora de descripciones de ofertas con IA
- Generación de biografía de perfil con IA
- Recomendaciones de ofertas para trabajadores
- Recomendaciones de trabajadores para empresas
- Sistema de cache para respuestas de IA

### Testing E2E
- Infraestructura completa con Playwright
- 27/39 tests pasando (69% de cobertura)
- Scripts automáticos para datos de prueba
- Tests de autenticación, PWA, onboarding, dashboard
- Reportes HTML y traces para debugging

## En Revisión / Pendientes Estratégicos

- **Modelo de Monetización**: Empresas de pago por publicación de ofertas y acceso a BBDD.
- **Sistema de Reputación/Valoraciones**: Valoraciones mutuas post-contratación.
- **Matchmaking Inteligente**: Sugerir perfiles a empresas basándose en filtros y experiencia.
- **Alertas Personalizadas**: Notificaciones push para nuevos empleos que coincidan con el perfil.

## Reglas de Idioma

- Todas las explicaciones, razonamientos y respuestas deben estar en **español**.
- Los comentarios en el código deben estar en español, a menos que el archivo ya utilice inglés.
- La salida de la terminal puede estar en inglés, pero las explicaciones siempre deben ser en español.

## Política de Cambios

Para mantener la coherencia del producto y la calidad del código, se deben seguir estas directrices:

- **No modificar la lógica de autenticación (Firebase)** sin una confirmación explícita.
- **No cambiar los roles de usuario ni la lógica de resolución de perfiles** sin discutirlo antes.
- **No modificar el esquema de Prisma** sin explicar el impacto de la migración.
- **REGLA DE ORO**: No tocar lo que ya funciona. Asegurarse de probar antes de modificar.
- Preferir cambios pequeños e incrementales.
- Explicar los cambios propuestos **antes** de aplicarlos.
- Preguntar antes de introducir nuevas dependencias.
- **Cualquier cambio que afecte a la visión de producto o al modelo de negocio debe ser validado con el fundador.**

---
*Este documento es una guía viva. Se actualizará conforme el proyecto evolucione.*
