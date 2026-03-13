# CLAUDE.md - Guía del Proyecto Agro Red / Campo Huelva

Este archivo proporciona orientación a Claude Code (o cualquier desarrollador) que trabaje en este repositorio.

## Descripción del Proyecto

**Agro Red** es una plataforma de empleo agrícola que conecta a trabajadores, jefes de cuadrilla, ingenieros y empresas del sector agrario español. Es una mezcla de Infojobs y red social vertical, construida como una PWA.

- **Origen**: Grupo de Facebook con +34.000 usuarios activos en Huelva
- **Despliegue**: https://agroredjob.com (Railway)
- **Última actualización**: 12 de marzo de 2026

### Visión de Producto

Construir una red profesional y de empleo fiable para el sector agrícola español, priorizando:
- Ofertas y demandas de empleo reales
- Perfiles verificados y adaptados a cada rol
- La figura del **jefe de cuadrilla** como elemento diferencial
- Confianza y transparencia
- Simplicidad y usabilidad

## Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Base de Datos
npx prisma generate
npx prisma db push

# Tests
npm run test:e2e           # Todos los tests
npm run test:e2e:ui        # Interfaz visual

# Scripts de prueba
npm run test:users:create  # Crear usuarios en Firebase
npm run test:seed          # Sembrar datos de prueba
```

## Arquitectura Técnica

### Autenticación
- **Firebase Auth**: Gestiona sesiones en frontend
- **PostgreSQL + Prisma**: Datos persistentes (UID de Firebase como clave primaria)
- **Firebase Admin SDK**: Verificación de tokens en servidor

### Roles de Usuario

| Rol | Descripción | Perfil |
|-----|-------------|--------|
| USER | Trabajador/Peón | WorkerProfile |
| FOREMAN | Jefe de cuadrilla (manijero) | ForemanProfile |
| ENGINEER | Ingeniero Técnico Agrícola | EngineerProfile |
| COMPANY | Empresa | CompanyProfile |
| ENCARGADO | Capataz/Encargado | EncargadoProfile |
| TRACTORISTA | Tractorista | TractoristProfile |

### Tipos de Publicación

- `OFFICIAL`: Ofertas de empresas verificadas (de pago)
- `SHARED`: Ofertas externas compartidas (solo admin)
- `DEMAND`: Demandas de empleo (trabajadores/manijeros)

### Inscripciones (Applications)

Estados: `PENDING` → `ACCEPTED` / `REJECTED` / `CONTACTED` / `WITHDRAWN`

Al inscribirse, el trabajador **autoriza automáticamente** que la empresa vea sus datos de contacto.

## Variables de Entorno

**Firebase (públicas - NEXT_PUBLIC_*)**:
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

**Base de datos (privadas)**:
```
DATABASE_URL              # PostgreSQL (Railway)
```

**Stripe**:
```
STRIPE_SECRET_KEY         # Clave secreta
STRIPE_WEBHOOK_SECRET     # Webhook signature
STRIPE_PREMIUM_PRICE_ID   # Precio suscripción premium
```

**Email (Resend)**:
```
RESEND_API_KEY            # Clave de API
RESEND_FROM_EMAIL         # Email remitente
```

## Funcionalidades Implementadas

### Autenticación y Usuarios
- [x] Registro con Firebase (email/contraseña y Google)
- [x] Onboarding con selección de rol
- [x] Verificación de email con Resend
- [x] Recuperación de contraseña con Resend
- [x] Perfiles detallados por rol (6 tipos)
- [x] Verificación manual de empresas

### Legal y RGPD
- [x] Política de Privacidad, Términos, Cookies, Aviso Legal
- [x] Registro de Actividades de Tratamiento (RAT)
- [x] Footer global con enlaces legales
- [x] Casillas de aceptación en registro
- [x] Banner de cookies con configuración

### Publicaciones y Feed
- [x] Feed con filtros por provincia y tipo
- [x] Publicación de ofertas (empresas) y demandas (trabajadores)
- [x] Sistema de Like, Compartir, Denunciar
- [x] Recomendaciones de ofertas por IA
- [x] "Mis Publicaciones" en perfil (ver, editar, eliminar)
- [x] Fechas y horas en todas las publicaciones

### Inscripciones y Contacto
- [x] Sistema de inscripciones con confirmación
- [x] Estados reversibles (Aceptar/Rechazar/Contactar)
- [x] Retiro de inscripciones
- [x] Chat/mensajería interna (texto, imágenes, PDF)
- [x] Sistema de contactos (aceptar solicitudes antes de chatear)

### Buscador de Candidatos
- [x] Página `/search` con 5 categorías
- [x] Filtros específicos por categoría
- [x] Modal de perfil completo
- [x] Restricción: solo empresas Premium pueden buscar

### Empresa (Premium)
- [x] Suscripciones con Stripe (99€/mes, 7 días trial)
- [x] Sincronización automática con Stripe
- [x] Emails de confirmación de pago
- [x] Historial de facturas
- [x] Gestión de suscripción en perfil
- [x] Galería de fotos (hasta 6)
- [x] Logo y descripción extendida
- [x] Página pública de empresa

### Componentes de UI
- [x] ConfirmDialog, PromptDialog (sin alerts nativos)
- [x] Sistema de notificaciones toast
- [x] Skeleton components
- [x] PhoneInput con validación
- [x] MultiSelectDropdown

### Seguridad
- [x] Headers de seguridad (CSP, HSTS, X-Frame-Options)
- [x] Verificación de tokens Firebase en servidor
- [x] Rate limiting en endpoints sensibles
- [x] Cliente HTTP autenticado (`apiFetch`)

### Testing
- [x] Playwright configurado (27/39 tests pasando)
- [x] Scripts de datos de prueba
- [x] Tests en dispositivos reales (Android/iOS)

### PWA
- [x] Manifest.json completo
- [x] Service Worker para offline
- [x] Iconos en todos los tamaños
- [x] Instalación desde home screen

### SEO
- [x] Meta tags dinámicos
- [x] Open Graph y Twitter Cards
- [x] Sitemap.xml y Robots.txt

## Tareas Pendientes

### Pendientes (sin fecha definida)

- [ ] **Internacionalización (i18n)**
  - Español, Francés, Rumano, Inglés
  - Prioridad baja

- [ ] **Sistema de Reputación/Valoraciones**
  - Valoraciones mutuas post-contratación
  - Badge de perfil verificado

- [ ] **Matchmaking Inteligente**
  - Algoritmo de compatibilidad candidato-oferta

- [ ] **Dashboard de Analytics**
  - Usuarios activos, ofertas cubiertas, etc.

### Mejoras de Suscripciones Premium (Futuras)

Las funcionalidades básicas de suscripciones están completas. Estas son mejoras pendientes para cuando sea necesario:

**Cambio de plan** (anual vs mensual):
- [ ] Permitir cambiar entre plan mensual (99€/mes) y anual (999€/año - 2 meses gratis)
- [ ] Prorrateo del precio al cambiar de plan
- [ ] Actualización automática en Stripe

**Trial extendido**:
- [ ] 14 días en lugar de 7 para empresas verificadas
- [ ] Incentivo para completar todo el perfil

**Mejoras en la gestión**:
- [ ] Botón "Saltar trial" para activar pago inmediato
- [ ] Renovación automática con recordatorios antes del cobro
- [ ] Alertas de pago fallido con instrucciones

---

## Sistema de Prueba Gratuita (En Desarrollo)

**Objetivo**: Simplificar el onboarding de empresas permitiendo una publicación gratuita tras aprobación del admin.

### Flujo
1. Empresa solicita prueba gratuita → Indica solo **volumen de trabajadores**
2. Admin recibe solicitud en panel → Aprueba/Rechaza
3. Empresa recibe email con **enlace directo** para publicar oferta gratis
4. Enlace es **token único** de un solo uso
5. Empresa no puede solicitar prueba nuevamente

### Pasos de Implementación

- [x] **1. Crear modelo `FreeTrialRequest` en Prisma**
  ```prisma
  model FreeTrialRequest {
    id          String   @id @default(uuid())
    companyId   String
    company     CompanyProfile @relation(fields: [companyId], references: [id])
    companySize String   // Volumen de trabajadores
    status      String   @default("PENDING") // PENDING, APPROVED, REJECTED, USED
    token       String?  @unique // Token único para publicar
    approvedAt  DateTime?
    usedAt      DateTime?
    createdAt   DateTime @default(now())

    @@index([status])
    @@index([companyId])
  }
  ```

- [x] **2. Crear `/api/trials/request`** (sustituye a `/api/coupons/request`)
  - POST con `{ companySize }`
  - Verifica que empresa no tenga solicitud previa (PENDING/APPROVED)
  - Crea solicitud con status PENDING

- [x] **3. Crear endpoints de admin para pruebas**
  - `GET /api/admin/trials` - Listar solicitudes pendientes
  - `PUT /api/admin/trials/[id]/approve` - Aprobar (genera token, envía email)
  - `DELETE /api/admin/trials/[id]` - Rechazar solicitud

- [ ] **4. Modificar panel admin**
  - Cambiar pestaña "Cupones" → "Pruebas gratuitas"
  - Mostrar lista con: Empresa, Tamaño, Fecha, Acciones
  - Agregar modal con perfil completo al hacer clic en nombre empresa

- [ ] **5. Sistema de tokens seguros**
  - Generar token UUID único al aprobar
  - Endpoint `/api/publish-with-trial?token=xxx`
  - Token se marca como USED después de publicar

- [ ] **6. Email de aprobación**
  - Asunto: "¡Tu prueba gratuita está lista!"
  - Enlace: `${APP_URL}/publish?trialToken=xxx`
  - Botón CTA: "Publicar mi oferta ahora"

- [ ] **7. Modificar `/publish` para aceptar token de prueba**
  - Leer `trialToken` de searchParams
  - Validar token con API
  - Permitir publicación sin Premium si token válido

- [ ] **8. Modificar `/api/posts` para aceptar token**
  - Validar token antes de crear post
  - Marcar solicitud como USED
  - Incrementar `usedCount` del post

- [ ] **9. Eliminar sistema de cupones (obsoleto)**
  - Eliminar modelo `Coupon` de Prisma
  - Eliminar `/api/coupons/*` endpoints
  - Eliminar `/api/admin/coupons/*` endpoints
  - Eliminar componentes de UI de cupones
  - Actualizar CLAUDE.md

- [ ] **10. Actualizar documentación**
  - Actualizar sección "Funcionalidades Implementadas"
  - Agregar nueva sección "Sistema de Prueba Gratuita"
  - Marcar cupones como obsoleto

## Reglas de Desarrollo

1. **REGLA DE ORO**: No tocar lo que ya funciona sin probar antes
2. Usar `apiFetch` para peticiones autenticadas
3. No modificar autenticación (Firebase) sin confirmación
4. No cambiar roles ni lógica de perfiles sin discutir
5. Preferir cambios pequeños e incrementales
6. Preguntar antes de añadir dependencias
7. **Cambios en visión de producto**: Validar con el fundador

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `src/lib/firebase.ts` | Cliente Firebase Auth |
| `src/lib/firebase-admin.ts` | Admin SDK para verificación |
| `src/lib/api-client.ts` | Cliente HTTP con autenticación |
| `src/lib/stripe.ts` | Cliente Stripe y helpers |
| `src/lib/validations.ts` | Validaciones centralizadas |
| `src/context/AuthContext.tsx` | Contexto de autenticación |
| `prisma/schema.prisma` | Esquema de base de datos |

---
*Este documento es una guía viva. Se actualizará conforme el proyecto evolucione.*
