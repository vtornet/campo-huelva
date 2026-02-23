# Plan de Testing - Red Agro (Campo Huelva)

**Versión:** 1.0
**Fecha:** 23 de febrero de 2026
**URL de Producción:** https://agroredjob.com
**Responsable:** ___________________
**Fecha de Ejecución:** ___________________

---

## Índice

1. [Test Cases por Rol](#test-cases-por-rol)
2. [Funcionalidades Críticas](#funcionalidades-críticas)
3. [Cross-Browser Testing](#cross-browser-testing)
4. [PWA Testing](#pwa-testing)
5. [Seguridad](#seguridad)
6. [Performance](#performance)
7. [Resumen de Bugs](#resumen-de-bugs)

---

## Test Cases por Rol

### 1. Trabajador/Peón (USER)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| T-001 | Registro con email/contraseña | 1. Ir a /login<br>2. Click en "Regístrate"<br>3. Ingresar email y contraseña<br>4. Completar registro | Usuario creado en Firebase, redirigido a onboarding | ⬜ |
| T-002 | Registro con Google | 1. Ir a /login<br>2. Click en "Continuar con Google"<br>3. Seleccionar cuenta<br>4. Completar registro | Usuario creado en Firebase, redirigido a onboarding | ⬜ |
| T-003 | Selección de rol Trabajador | 1. En onboarding, click en "Busco Trabajo"<br>2. Verificar redirección | Redirigido a /profile/worker | ⬜ |
| T-004 | Completar perfil de trabajador | 1. Rellenar todos los campos obligatorios<br>2. Subir foto de perfil<br>3. Guardar | Perfil guardado, redirigido al dashboard | ⬜ |
| T-005 | Ver feed de ofertas | 1. En dashboard, ver ofertas<br>2. Cambiar entre Ofertas/Demandas<br>3. Filtrar por provincia | Se muestran ofertas correctamente, filtros funcionan | ⬜ |
| T-006 | Ver detalle de oferta | 1. Click en una oferta<br>2. Ver detalles completos | Se abre /offer/[id] con toda la información | ⬜ |
| T-007 | Inscribirse en oferta | 1. En detalle de oferta, click "Inscribirse"<br>2. Aceptar confirmación<br>3. Verificar cambio de estado | Inscripción creada, botón cambia a "Inscrito" | ⬜ |
| T-008 | Retirar inscripción | 1. En oferta inscrita, click "Retirarme"<br>2. Confirmar | Inscripción eliminada, botón vuelve a "Inscribirse" | ⬜ |
| T-009 | Crear demanda de empleo | 1. Click en "Publicar"<br>2. Seleccionar "Demanda"<br>3. Rellenar formulario<br>4. Publicar | Demanda creada y visible en el feed | ⬜ |
| T-010 | Ver mis inscripciones | 1. Ir a /my-applications<br>2. Ver listado | Se muestran todas las inscripciones con estados | ⬜ |
| T-011 | Ver recomendaciones IA | 1. En dashboard, buscar sección "Recomendado para ti"<br>2. Ver ofertas sugeridas | Se muestran ofertas relevantes al perfil | ⬜ |
| T-012 | Dar like a publicación | 1. Click en corazón de una publicación | Contador de likes incrementa, corazón se marca | ⬜ |
| T-013 | Denunciar publicación | 1. Click en "···"<br>2. Click "Denunciar"<br>3. Seleccionar motivo<br>4. Enviar | Notificación de denuncia enviada | ⬜ |

---

### 2. Jefe de Cuadrilla (FOREMAN)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| F-001 | Selección de rol Manijero | 1. En onboarding, click en "Soy Manijero" | Redirigido a /profile/foreman | ⬜ |
| F-002 | Completar perfil con cuadrilla | 1. Rellenar datos personales<br>2. Especificar número de componentes<br>3. Indicar disponibilidad de furgoneta<br>4. Guardar | Perfil guardado con datos de cuadrilla | ⬜ |
| F-003 | Publicar oferta de cuadrilla | 1. Click en "Publicar"<br>2. Seleccionar "Oferta"<br>3. Rellenar formulario<br>4. Publicar | Oferta creada visible en el feed | ⬜ |
| F-004 | Editar publicación | 1. Ir a /profile<br>2. Pestaña "Mis Publicaciones"<br>3. Click en editar de una publicación<br>4. Modificar y guardar | Publicación actualizada | ⬜ |
| F-005 | Eliminar publicación | 1. En "Mis Publicaciones", click en eliminar<br>2. Confirmar | Publicación eliminada, ya no visible en feed | ⬜ |

---

### 3. Ingeniero (ENGINEER)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| E-001 | Selección de rol Ingeniero | 1. En onboarding, click en "Soy Ingeniero" | Redirigido a /profile/engineer | ⬜ |
| E-002 | Completar perfil técnico | 1. Ingresar número de colegiado/ROPO<br>2. Seleccionar especialidad<br>3. Indicar servicios ofrecidos<br>4. Guardar | Perfil técnico guardado | ⬜ |
| E-003 | Aparecer en buscador | 1. Como empresa, ir a /search<br>2. Seleccionar "Ingeniero"<br>3. Aplicar filtros | Ingeniero aparece en resultados | ⬜ |

---

### 4. Empresa (COMPANY)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| C-001 | Registro de empresa | 1. Registrarse como COMPANY<br>2. Completar datos fiscales | Cuenta creada, estado "pendiente de verificación" | ⬜ |
| C-002 | Verificación de empresa | 1. Admin verifica la empresa<br>2. Empresa inicia sesión | Etiqueta "Empresa Verificada" visible | ⬜ |
| C-003 | Publicar oferta OFICIAL | 1. Click en "Publicar"<br>2. Seleccionar "Oferta"<br>3. Rellenar formulario completo<br>4. Publicar | Oferta OFICIAL creada con etiqueta de empresa | ⬜ |
| C-004 | Ver candidatos inscritos | 1. Ir a /applications<br>2. Ver lista de candidatos por oferta | Lista de inscritos con datos básicos | ⬜ |
| C-005 | Ver perfil completo de candidato | 1. En /applications, click en un candidato<br>2. Ver modal con perfil completo | Se muestran todos los datos del candidato | ⬜ |
| C-006 | Aplicar filtros avanzados | 1. En /applications, abrir filtros<br>2. Aplicar filtro por experiencia<br>3. Aplicar filtro por carnets<br>4. Aplicar filtro por provincia | Resultados se filtran correctamente | ⬜ |
| C-007 | Aceptar candidato | 1. En candidato, click "Aceptar"<br>2. Confirmar | Estado cambia a ACCEPTED, candidato notificado | ⬜ |
| C-008 | Rechazar candidato | 1. En candidato, click "Rechazar"<br>2. Confirmar | Estado cambia a REJECTED | ⬜ |
| C-009 | Marcar como contactado | 1. En candidato, click "Contactado"<br>2. Confirmar | Estado cambia a CONTACTED | ⬜ |
| C-010 | Buscar trabajadores | 1. Ir a /search<br>2. Seleccionar categoría<br>3. Aplicar filtros | Resultados con trabajadores disponibles | ⬜ |
| C-011 | Ver recomendaciones de trabajadores | 1. En dashboard, ver "Trabajadores Recomendados" | Se muestran candidatos según necesidades | ⬜ |

---

### 5. Encargado/Capataz (ENCARGADO)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| EN-001 | Selección de rol Encargado | 1. En onboarding, click en "Soy Encargado/Capataz" | Redirigido a /profile/encargado | ⬜ |
| EN-002 | Completar perfil de encargado | 1. Indicar experiencia en cultivos<br>2. Especificar manejo de tractor<br>3. Indicar zona de trabajo<br>4. Guardar | Perfil guardado correctamente | ⬜ |

---

### 6. Tractorista (TRACTORISTA)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| TR-001 | Selección de rol Tractorista | 1. En onboarding, click en "Soy Tractorista" | Redirigido a /profile/tractorista | ⬜ |
| TR-002 | Completar perfil de maquinaria | 1. Seleccionar tipos de maquinaria<br>2. Seleccionar aperos<br>3. Indicar carnets<br>4. Guardar | Perfil guardado correctamente | ⬜ |

---

### 7. Administrador (ADMIN)

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| A-001 | Acceso a panel admin | 1. Iniciar sesión como admin<br>2. Ir a /admin | Panel de administración visible | ⬜ |
| A-002 | Verificar empresa | 1. En lista de empresas, click en verificar<br>2. Confirmar | Empresa marcada como verificada | ⬜ |
| A-003 | Banear usuario | 1. Buscar usuario<br>2. Click en "Banear"<br>3. Ingresar motivo<br>4. Confirmar | Usuario baneado, no puede acceder | ⬜ |
| A-004 | Desbanear usuario | 1. Buscar usuario baneado<br>2. Click en "Desbanear"<br>3. Confirmar | Usuario recuperado | ⬜ |
| A-005 | Silenciar usuario | 1. Buscar usuario<br>2. Click en "Silenciar"<br>3. Confirmar | Usuario silenciado (no puede publicar) | ⬜ |
| A-006 | Cambiar rol de usuario | 1. Buscar usuario<br>2. Click en "Cambiar rol"<br>3. Seleccionar nuevo rol<br>4. Confirmar | Rol actualizado | ⬜ |
| A-007 | Publicar oferta compartida | 1. En dashboard, click "Compartir oferta"<br>2. Rellenar formulario<br>3. Publicar | Oferta SHARED creada con etiqueta especial | ⬜ |

---

## Funcionalidades Críticas

### Autenticación y Registro

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| AUTH-001 | Login con credenciales correctas | 1. Ingresar email y contraseña válidos<br>2. Click "Iniciar sesión" | Sesión iniciada, redirigido al dashboard | ⬜ |
| AUTH-002 | Login con credenciales incorrectas | 1. Ingresar email/contraseña inválidos<br>2. Click "Iniciar sesión" | Mensaje de error, no se inicia sesión | ⬜ |
| AUTH-003 | Cerrar sesión | 1. Click en menú de perfil<br>2. Click "Cerrar sesión" | Sesión cerrada, redirigido a /login | ⬜ |
| AUTH-004 | Reset de contraseña | 1. Click "¿Olvidaste tu contraseña?"<br>2. Ingresar email<br>3. Check email | Email de reset recibido | ⬜ |
| AUTH-005 | Redirección por perfil incompleto | 1. Usuario sin perfil completo intenta acceder al dashboard | Redirigido a página de perfil | ⬜ |

### Chat y Mensajería

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| CHAT-001 | Iniciar conversación | 1. Click en "Contactar" de un perfil<br>2. Escribir mensaje<br>3. Enviar | Conversación creada, mensaje enviado | ⬜ |
| CHAT-002 | Ver lista de conversaciones | 1. Ir a /messages | Lista de conversaciones activas | ⬜ |
| CHAT-003 | Ver conversación individual | 1. Click en una conversación | Se abre el chat completo | ⬜ |
| CHAT-004 | Enviar mensaje en conversación | 1. Escribir mensaje<br>2. Click enviar o Enter | Mensaje añadido a la conversación | ⬜ |
| CHAT-005 | Recibir mensaje | 1. Otro usuario envía mensaje<br>2. Recargar o esperar | Mensaje recibido y visible | ⬜ |
| CHAT-006 | Ver badge de mensajes no leídos | 1. Recibir mensajes sin leer | Contador de mensajes no leídos visible | ⬜ |

### Notificaciones

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| NOTIF-001 | Recibir notificación de inscripción | 1. Trabajador se inscribe en oferta de empresa | Empresa recibe notificación | ⬜ |
| NOTIF-002 | Recibir notificación de aceptación | 1. Empresa acepta candidato | Candidato recibe notificación | ⬜ |
| NOTIF-003 | Ver lista de notificaciones | 1. Ir a /notifications | Lista de notificaciones históricas | ⬜ |
| NOTIF-004 | Marcar notificación como leída | 1. Click en una notificación | Notificación marcada como leída | ⬜ |
| NOTIF-005 | Badge de notificaciones no leídas | 1. Tener notificaciones sin leer | Contador visible en el icono de campana | ⬜ |

### Subida de Imágenes

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| IMG-001 | Subir foto de perfil | 1. En perfil, click en avatar<br>2. Seleccionar imagen<br>3. Confirmar | Foto subida y visible | ⬜ |
| IMG-002 | Subir imagen inválida | 1. Intentar subir archivo no imagen | Error de validación | ⬜ |
| IMG-003 | Subir imagen muy grande | 1. Intentar subir imagen >5MB | Error de tamaño o redimensionamiento automático | ⬜ |

### Funciones IA

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| AI-001 | Mejorar descripción con IA | 1. Al crear oferta, click en "Mejorar con IA"<br>2. Esperar sugerencia | Descripción mejorada generada | ⬜ |
| AI-002 | Generar biografía con IA | 1. En perfil, click en "Generar con IA"<br>2. Ingresar detalles<br>3. Generar | Biografía generada | ⬜ |
| AI-003 | Recomendaciones de ofertas | 1. Como trabajador, ver recomendaciones | Ofertas relevantes mostradas | ⬜ |
| AI-004 | Recomendaciones de trabajadores | 1. Como empresa, ver recomendaciones | Candidatos relevantes mostrados | ⬜ |

---

## Cross-Browser Testing

| Navegador | Versión | Dispositivo | Estado General | Bugs Encontrados |
|-----------|---------|-------------|-----------------|------------------|
| Chrome | Última | Desktop | ⬜ | |
| Chrome | Última | Android | ⬜ | |
| Safari | Última | macOS | ⬜ | |
| Safari | Última | iOS | ⬜ | |
| Firefox | Última | Desktop | ⬜ | |
| Edge | Última | Desktop | ⬜ | |

### Tests Específicos por Navegador

| ID | Test | Chrome | Safari | Firefox | Edge |
|----|------|--------|--------|---------|------|
| CB-001 | Registro y login | ⬜ | ⬜ | ⬜ | ⬜ |
| CB-002 | Subida de imágenes | ⬜ | ⬜ | ⬜ | ⬜ |
| CB-003 | PWA instalación | ⬜ | ⬜ | ⬜ | ⬜ |
| CB-004 | Notificaciones push | ⬜ | ⬜ | ⬜ | ⬜ |
| CB-005 | Responsive design | ⬜ | ⬜ | ⬜ | ⬜ |
| CB-006 | Animaciones | ⬜ | ⬜ | ⬜ | ⬜ |

---

## PWA Testing

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| PWA-001 | Instalación en Chrome Desktop | 1. Abrir app en Chrome<br>2. Verificar icono de instalación en omnibar | Icono de instalación visible | ⬜ |
| PWA-002 | Instalar app | 1. Click en icono de instalación<br>2. Confirmar instalación | App instalada, abre en ventana independiente | ⬜ |
| PWA-003 | Instalación en Android | 1. Abrir en Chrome Android<br>2. Verificar prompt de instalación | Prompt de "Añadir a pantalla de inicio" aparece | ⬜ |
| PWA-004 | Instalación en iOS | 1. Abrir en Safari iOS<br>2. Click "Compartir" > "Añadir a inicio" | App instalada en home screen | ⬜ |
| PWA-005 | Modo offline - app instalada | 1. Instalar app<br>2. Abrir sin conexión<br>3. Navegar páginas visitadas | Contenido caché mostrado, sin error de red | ⬜ |
| PWA-006 | Service Worker activo | 1. Abrir DevTools > Application > Service Workers | Service Worker activo y ejecutándose | ⬜ |
| PWA-007 | Manifest válido | 1. Verificar manifest.json | Manifest contiene nombre, iconos, colores | ⬜ |
| PWA-008 | Splash screen | 1. Abrir app instalada | Splash screen con logo se muestra | ⬜ |
| PWA-009 | Actualización de contenido | 1. Navegar con conexión<br>2. Ir offline<br>3. Volver online | Contenido se actualiza correctamente | ⬜ |

---

## Seguridad

| ID | Caso de Prueba | Pasos | Resultado Esperado | Estado |
|----|----------------|-------|-------------------|--------|
| SEC-001 | Acceso a ruta protegida sin auth | 1. Cerrar sesión<br>2. Intentar acceder a /profile directamente | Redirigido a /login | ⬜ |
| SEC-002 | Solo empresas pueden publicar OFICIAL | 1. Como trabajador, intentar publicar oferta OFICIAL | Error o bloqueo de acción | ⬜ |
| SEC-003 | Solo admin puede publicar SHARED | 1. Como usuario normal, intentar publicar SHARED | Error o bloqueo de acción | ⬜ |
| SEC-004 | Protección de datos de contacto | 1. Como trabajador, ver perfil de otro trabajador | Email/teléfono no visibles | ⬜ |
| SEC-005 | Datos visibles para inscritos | 1. Como empresa, ver candidato inscrito | Email/teléfono visibles | ⬜ |
| SEC-006 | Usuario baneado no puede acceder | 1. Banear usuario<br>2. Intentar acceder | Mensaje de cuenta suspendida | ⬜ |
| SEC-007 | Edición solo de propias publicaciones | 1. Intentar editar publicación de otro usuario | Error "Sin permisos" | ⬜ |
| SEC-008 | XSS en campos de texto | 1. Ingresar script tags en descripción<br>2. Guardar y visualizar | Script sanitizado, no ejecutado | ⬜ |
| SEC-009 | Headers de seguridad | 1. Verificar headers HTTP (CSP, X-Frame-Options, etc.) | Headers configurados correctamente | ⬜ |
| SEC-010 | Rate limiting en endpoints críticos | 1. Enviar múltiples requests rápidas a /api/posts | Límite de requests aplicado | ⬜ |

---

## Performance

| ID | Métrica | Objetivo | Actual | Estado |
|----|---------|----------|--------|--------|
| PERF-001 | LCP (Largest Contentful Paint) | < 2.5s | ___ | ⬜ |
| PERF-002 | FID (First Input Delay) | < 100ms | ___ | ⬜ |
| PERF-003 | CLS (Cumulative Layout Shift) | < 0.1 | ___ | ⬜ |
| PERF-004 | Time to Interactive | < 3s | ___ | ⬜ |
| PERF-005 | First Contentful Paint | < 1.5s | ___ | ⬜ |
| PERF-006 | Tamaño del bundle JS | < 500KB | ___ | ⬜ |
| PERF-007 | Tamaño de imágenes optimizadas | < 200KB promedio | ___ | ⬜ |

---

## Dispositivos de Prueba

### Dispositivos Físicos

| Dispositivo | OS | Versión | Pantalla | Probado |
|-------------|-----|---------|----------|---------|
| iPhone 12/13/14 | iOS | 16+ | 6.1" | ⬜ |
| Samsung Galaxy S21/S22 | Android | 12+ | 6.2" | ⬜ |
| iPad | iPadOS | 16+ | 10.2" | ⬜ |
| Tablet Android | Android | 12+ | 10" | ⬜ |
| Laptop Windows | Windows | 10/11 | 13-15" | ⬜ |
| MacBook | macOS | 13+ | 13-16" | ⬜ |

### Emuladores/Simuladores

| Herramienta | Dispositivos | Probado |
|-------------|--------------|---------|
| Chrome DevTools Device Mode | Múltiples | ⬜ |
| iOS Simulator | iPhone/iPad | ⬜ |
| Android Studio Emulator | Múltiples | ⬜ |

---

## Resumen de Bugs

| ID | Severidad | Título | Descripción | Pasos para Reproducir | Estado |
|----|-----------|--------|-------------|----------------------|--------|
| BUG-001 | 🔴 Alta | | | | Abierto |
| BUG-002 | 🟡 Media | | | | Abierto |
| BUG-003 | 🟢 Baja | | | | Abierto |

**Severidades:**
- 🔴 **Alta:** Bloquea funcionalidad crítica o afecta experiencia de muchos usuarios
- 🟡 **Media:** Funcionalidad afectada pero hay workaround
- 🟢 **Baja:** Issue cosmético o menor

---

## Checklist Pre-Producción

Antes de considerar la app lista para producción:

- [ ] Todos los tests críticos (CRIT) pasan
- [ ] Tests de seguridad completados sin issues graves
- [ ] PWA funciona en iOS y Android
- [ ] Performance cumple objetivos Lighthouse
- [ ] No bugs de severidad Alta abiertos
- [ ] Documentación de usuario creada
- [ ] Política de privacidad publicada
- [ ] Términos de uso publicados
- [ ] Backup de base de datos configurado
- [ ] Monitoreo de errores configurado
- [ ] Analytics configurado

---

## Notas Adicionales

**Probador:** ___________________
**Fecha inicio:** ___________________
**Fecha fin:** ___________________
**Horas invertidas:** __________________

**Comentarios generales:**



---

## Firma de Aprobación

**Probador:** ___________________ **Fecha:** ___________________

**Product Owner:** ___________________ **Fecha:** ___________________
