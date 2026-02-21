# CLAUDE.md - Guía del Proyecto Red Agro / Campo Huelva

Este archivo proporciona orientación a Claude Code (o cualquier desarrollador) que trabaje en este repositorio. Contiene tanto las directrices técnicas como la visión estratégica del producto.

## Descripción General del Proyecto

**Red Agro (nombre técnico: Campo Huelva)** es una plataforma de empleo agrícola que conecta a trabajadores, jefes de cuadrilla (manijeros), ingenieros y empresas del sector agrario español. Es una mezcla de Infojobs y red social vertical, construida como una PWA (Progressive Web App) para garantizar el acceso desde cualquier dispositivo móvil, incluso en zonas con baja cobertura.

El proyecto nace de un grupo de Facebook con más de **34.000 usuarios activos en Huelva**, lo que proporciona una validación real y una tracción inicial inigualable.

### Visión de Producto
Construir una red profesional y de empleo fiable, centrada exclusivamente en el sector agrícola español, priorizando:
- Ofertas y demandas de empleo reales.
- Perfiles de usuario verificados y adaptados a cada rol (trabajador, jefe de cuadrilla, ingeniero, empresa).
- La figura del **jefe de cuadrilla** como elemento diferencial (equipos completos y formados, con un responsable único).
- Confianza y transparencia entre todas las partes.
- Simplicidad y usabilidad por encima de funciones sociales genéricas.
- Escalabilidad para convertirse en la herramienta de referencia a nivel nacional.

**Diferenciador clave**: El fundador tiene una dilatada experiencia como director de zona en importantes ETT del sector agroalimentario. Este conocimiento profundo de la legislación, las necesidades reales y los puntos de dolor del sector es el verdadero producto. Red Agro **no es una ETT ni una empresa de servicios**, sino un marketplace de conexión que respeta la legalidad (pago directo, convenios colectivos) y empodera a los profesionales del campo.

## Estado del Proyecto

Proyecto en desarrollo activo. Aún no se garantiza compatibilidad con versiones anteriores, pero cualquier cambio importante debe discutirse previamente.

**Despliegue**: Railway con dominio propio https://agroredjob.com

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

### 5. Filtros Avanzados en Gestión de Candidatos
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

### 9. Validaciones y UX Final
- [ ] Validar todos los formularios exhaustivamente
- [ ] Mensajes de error más amigables y específicos
- [ ] Estados de carga en todas las operaciones async
- [ ] Pantallas de error (404, 500) con navegación de vuelta
- [ ] Skeletons durante carga de contenido

### 10. Seguridad
- [ ] Verificar que todas las APIs están protegidas (validación de userId)
- [ ] Rate limiting en endpoints sensibles (contacto, inscripciones)
- [ ] Headers de seguridad (CORS, CSP, HSTS)
- [ ] Sanitización de inputs para prevenir XSS

### 11. Testing
- [ ] Probar flujo completo de cada rol (registro, perfil, publicar, inscribirse)
- [ ] Probar en dispositivos móviles reales (Android e iOS)
- [ ] Probar en diferentes navegadores (Chrome, Safari, Firefox)
- [ ] Probar en modo offline (cuando se implemente PWA)

### 12. Legal / Comunicación
- [ ] Política de Privacidad (RGPD compliant)
- [ ] Términos y Condiciones de uso
- [ ] Política de Cookies
- [ ] Aviso Legal
- [ ] Contacto y soporte

## Funcionalidades Ya Implementadas

- Feed con filtros por provincia y tipo de publicación.
- Publicación de ofertas (empresas) y demandas (trabajadores/jefes de cuadrilla).
- Sistema de "Like", "Compartir", "Denunciar", "Inscribirse".
- Verificación manual de empresas (etiqueta "Empresa Verificada").
- Perfiles detallados por rol (trabajador, manijero, ingeniero, empresa).
- Sistema de inscripciones con notificaciones a empresas.
- Las empresas ven datos de contacto de candidatos (autorizado al inscribirse).
- Modal de perfil completo para empresas.
- Chat/mensajería interna entre usuarios.
- Sistema de notificaciones.
- Reporte de contenido (denuncias).

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
