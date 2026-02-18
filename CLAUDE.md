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

## Arquitectura Técnica

### Sistema de Autenticación Dual
La aplicación utiliza **Firebase Auth** para la autenticación en el frontend y **PostgreSQL (via Prisma)** para los datos persistentes de usuario.
- El UID de Firebase (`user.uid`) es la clave primaria en la base de datos.
- **Firebase**: Gestiona el estado de autenticación (inicio/cierre de sesión) a través de `src/lib/firebase.ts`.
- **Prisma/PostgreSQL**: Almacena perfiles de usuario, publicaciones, solicitudes y conexiones.
- **Sincronización**: Cuando los usuarios se registran mediante `/api/register`, su UID de Firebase se almacena como `User.id` en Prisma.

### Roles de Usuario
Definidos en `prisma/schema.prisma`:
- **USER** (Trabajador): Busca empleo individualmente.
- **FOREMAN** (Manijero): Líder de cuadrilla, ofrece un equipo completo y formado.
- **COMPANY** (Empresa): Contrata trabajadores o cuadrillas.

Cada rol tiene una tabla de perfil dedicada: `WorkerProfile`, `ForemanProfile`, `CompanyProfile`.

### Modelos de Datos Clave

**Sistema de Publicaciones** (anteriormente "ofertas", renombrado para ser más genérico):
- `PostType.OFFICIAL`: Ofertas verificadas publicadas por empresas (de pago).
- `PostType.SHARED`: Ofertas externas compartidas por usuarios (actualmente en revisión su continuidad para evitar que empresas eludan el pago).
- `PostType.DEMAND`: Demandas de empleo publicadas por trabajadores o jefes de cuadrilla.

**Perfiles Detallados**:
- **Trabajador**: Datos personales, vehículo, disponibilidad, carnets (fitosanitario, manipulador de alimentos), experiencia por cultivos y tareas, años de campaña.
- **Jefe de cuadrilla**: Todo lo anterior + número de componentes de la cuadrilla, disponibilidad de furgoneta/herramientas. **No puede fijar precio**, ya que debe ajustarse al convenio colectivo de la provincia, lo que aporta transparencia y legalidad.
- **Ingeniero**: Datos técnicos, especialidad, número ROPO, colegiatura.
- **Empresa**: Datos fiscales, y tras verificación manual, acceso a publicación de ofertas y BBDD.

**Lógica de Resolución de Perfil**: El endpoint `/api/user/me` implementa una lógica inteligente: si el rol de un usuario no coincide con su perfil existente, devuelve el perfil que realmente existe con el rol corregido. Esto evita errores de interfaz por desajustes.

## Estructura de la Aplicación (App Router)

- `src/app/`
  - `page.tsx`: Dashboard principal con feed filtrable por provincia y tipo de publicación.
  - `login/`: Autenticación con Firebase.
  - `onboarding/`: Selección de rol para nuevos usuarios.
  - `profile/worker/`, `profile/foreman/`, `profile/company/`: Formularios de edición de perfil.
  - `publish/`: Creación de publicaciones con selección de tipo.
- `src/app/api/`
  - `register/`: Crea el usuario en Prisma a partir de la autenticación de Firebase.
  - `user/me/`: Devuelve los datos del usuario con resolución de perfil.
  - `posts/`: Obtiene el feed (GET) y crea publicaciones (POST).
- `src/context/AuthContext.tsx`: Provee el estado de autenticación mediante el hook `useAuth()`.
- `src/lib/constants.ts`: Listas de provincias, tipos de cultivo, municipios de Huelva, etc.

### Patrones Importantes

- **Comprobación de Perfil Completo**: En `page.tsx`, los usuarios son redirigidos a onboarding si su perfil carece de nombre (`fullName` o `companyName`). Esto se aplica antes de mostrar el dashboard.
- **Asociación de Autor en Publicaciones**: Al crear una publicación, la API asocia automáticamente el publicador correcto:
  - Empresas → `companyId` + tipo OFFICIAL.
  - Trabajadores/Jefes de cuadrilla → `publisherId` + tipo SHARED o DEMAND.
- **Código de Colores por Rol**:
  - Trabajadores: Tema verde (`bg-green-*`, `text-green-*`)
  - Jefes de cuadrilla: Tema naranja (`bg-orange-*`, `text-orange-*`)
  - Empresas: Tema azul (menos usado, predomina el verde)

### Variables de Entorno Requeridas

**Para Firebase (públicas):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Para la Base de Datos (privadas):**
- `DATABASE_URL`: Cadena de conexión a PostgreSQL.

## Funcionalidades Clave (MVP y Visión)

### Actuales (en el código)
- Feed con filtros por provincia y tarea (recolección, poda, manipulación...).
- Publicación de ofertas (empresas) y demandas (trabajadores/jefes de cuadrilla).
- Sistema de "Like", "Compartir", "Denunciar", "Inscribirse" en cada oferta.
- Verificación manual de empresas (etiqueta "Empresa Verificada").
- Perfiles detallados por rol.

### En Revisión / Pendientes Estratégicos
- **Ofertas externas (compartir enlaces)**: Se debate si mantener, eliminar o restringir esta función para evitar que empresas eludan el pago. La decisión final se tomará en base al comportamiento de los usuarios.
- **Modelo de Monetización**: Empresas de pago por publicación de ofertas y acceso a BBDD. Posible publicidad segmentada. Perfiles demandantes, gratuitos.
- **Sistema de Reputación/Valoraciones**: Valoraciones mutuas post-contratación para generar confianza (sin intervenir en pagos).
- **Matchmaking Inteligente**: Sugerir perfiles a empresas basándose en filtros y experiencia.
- **Alertas Personalizadas**: Notificaciones push para nuevos empleos que coincidan con el perfil.
- **Modo Offline**: Permitir consultar ofertas y enviar solicitudes sin conexión (crítico en zonas rurales).
- **Internacionalización**: Soporte multiidioma (español, inglés, francés, árabe, rumano) para temporeros extranjeros.

## Reglas de Idioma

- Todas las explicaciones, razonamientos y respuestas deben estar en **español**.
- Los comentarios en el código deben estar en español, a menos que el archivo ya utilice inglés.
- La salida de la terminal puede estar en inglés, pero las explicaciones siempre deben ser en español.

## Política de Cambios

Para mantener la coherencia del producto y la calidad del código, se deben seguir estas directrices:

- **No modificar la lógica de autenticación (Firebase)** sin una confirmación explícita.
- **No cambiar los roles de usuario ni la lógica de resolución de perfiles** sin discutirlo antes.
- **No modificar el esquema de Prisma** sin explicar el impacto de la migración.
- Preferir cambios pequeños e incrementales.
- Explicar los cambios propuestos **antes** de aplicarlos.
- Preguntar antes de introducir nuevas dependencias.
- **Cualquier cambio que afecte a la visión de producto o al modelo de negocio debe ser validado con el fundador.**

## Regla de oro
No tocar lo que ya funciona y asegurarse de ello en cada modificación que se realice

---
*Este documento es una guía viva. Se actualizará conforme el proyecto evolucione.*