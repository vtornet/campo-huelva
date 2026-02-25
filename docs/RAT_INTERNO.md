# REGISTRO DE ACTIVIDADES DE TRATAMIENTO (RAT)
## Documento Interno - RGPD Art. 30

**Responsable del tratamiento:** Víctor José Tornet García (Appstracta)
**NIF:** 77534989B
**Fecha de creación:** 25 de febrero de 2026
**Última actualización:** 25 de febrero de 2026

---

## 1. Identificación del Responsable

| Campo | Valor |
|-------|-------|
| Nombre | Víctor José Tornet García |
| Nombre comercial | Appstracta |
| NIF | 77534989B |
| Dirección | Lepe, Huelva, España |
| Email | contact@appstracta.app |
| Actividad | Plataforma digital de empleo agrícola |
| Sitio web | appstracta.app |

---

## 2. Actividades de Tratamiento

### Actividad 1: Gestión de Usuarios y Cuentas

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Gestión de usuarios y cuentas de acceso |
| **Descripción** | Registro, autenticación y gestión de perfiles de usuario en la plataforma |
| **Base legal** | Ejecución de contrato (art. 6.1.b RGPD) + Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | Usuarios de la plataforma (trabajadores, empresas, profesionales) |
| **Categorías de datos** | - Identificación: nombre, apellidos, email, teléfono, foto<br>- Credenciales: hash de contraseña (gestionado por Firebase)<br>- Datos profesionales: rol, experiencia, carnets<br>- Datos de ubicación: provincia, localidad |
| **Categorías de destinatarios** | - Firebase (Google LLC) - autenticación y base de datos<br>- Railway - hosting y base de datos<br>- Otros usuarios (solo datos públicos del perfil) |
| **Transferencias internacionales** | Sí, a Firebase/Google (USA con cláusulas contractuales tipo UE-EEUU) |
| **Plazos de conservación** | Mientras la cuenta esté activa. Tras baja: 3 años para cumplir obligaciones legales |
| **Medidas de seguridad** | - Autenticación mediante Firebase Auth<br>- Conexiones HTTPS<br>- Rate limiting<br>- Control de accesos |

---

### Actividad 2: Publicaciones de Empleo y Perfil Profesional

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Gestión de publicaciones (ofertas, demandas, tablón) |
| **Descripción** | Publicación, moderación y gestión de ofertas de empleo, demandas y contenido del tablón social |
| **Base legal** | Ejecución de contrato (art. 6.1.b RGPD) + Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | - Trabajadores<br>- Empresas<br>- Manijeros<br>- Profesionales del sector agrícola |
| **Categorías de datos** | - Datos del autor de la publicación<br>- Contenido de la publicación (título, descripción, requisitos)<br>- Datos de contacto (para empresas verificadas)<br>- Datos de salud indirectos: carnets fitosanitarios |
| **Categorías de destinatarios** | - Usuarios registrados (visualización)<br>- Firebase (Google LLC)<br>- OpenAI (mejora de contenido con IA, sin entrenamiento) |
| **Transferencias internacionales** | Sí, a Firebase/Google y OpenAI (cláusulas contractuales tipo) |
| **Plazos de conservación** | Mientras la publicación esté activa o hasta solicitud de eliminación |
| **Medidas de seguridad** | - Moderación de contenido<br>- Sistema de denuncias<br>- Posibilidad de eliminación por el autor |

---

### Actividad 3: Gestión de Inscripciones y Candidaturas

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Inscripciones en ofertas de empleo |
| **Descripción** | Gestión de candidaturas de trabajadores a ofertas de empleo publicadas por empresas |
| **Base legal** | Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | - Trabajadores<br>- Empresas ofertantes |
| **Categorías de datos** | - Datos del trabajador: nombre, email, teléfono, experiencia<br>- Datos de la oferta<br>- Fecha y estado de la inscripción<br>- Autorización de datos de contacto (consentimiento explícito) |
| **Categorías de destinatarios** | - Empresas que publican la oferta (datos completos del inscrito)<br>- Firebase (Google LLC) |
| **Transferencias internacionales** | Sí, a Firebase/Google |
| **Plazos de conservación** | 1 año tras el cierre de la oferta (para gestiones administrativas) |
| **Medidas de seguridad** | - Consentimiento explícito al inscribirse<br>- Posibilidad de retirar la inscripción<br>- Acceso solo para la empresa ofertante |

---

### Actividad 4: Mensajería Interna

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Sistema de mensajería entre usuarios |
| **Descripción** | Comunicaciones entre usuarios de la plataforma para facilitar el contacto laboral |
| **Base legal** | Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | Usuarios registrados que inician o reciben mensajes |
| **Categorías de datos** | - Contenido del mensaje<br>- Remitente y destinatario<br>- Fecha y hora<br>- Estado de lectura |
| **Categorías de destinatarios** | - Participantes en la conversación<br>- Firebase (Google LLC) |
| **Transferencias internacionales** | Sí, a Firebase/Google |
| **Plazos de conservación** | 1 año tras el cierre de cuenta del último participante |
| **Medidas de seguridad** | - Solo los participantes pueden acceder<br>- End-to-end no implementado (Firebase gestionado) |

---

### Actividad 5: Tablón Social

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Red social vertical para el sector agrícola |
| **Descripción** | Publicaciones de carácter social (compartir coche, consultar, etc.), comentarios y likes |
| **Base legal** | Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | Usuarios registrados (excepto empresas) |
| **Categorías de datos** | - Contenido de la publicación<br>- Autor y fecha<br>- Comentarios y likes<br>- Denuncias realizadas |
| **Categorías de destinatarios** | - Usuarios registrados (visualización)<br>- Firebase (Google LLC) |
| **Transferencias internacionales** | Sí, a Firebase/Google |
| **Plazos de conservación** | Mientras la publicación esté activa o hasta solicitud de eliminación |
| **Medidas de seguridad** | - Sistema de denuncias<br>- Moderación de contenido<br>- Eliminación por el autor |

---

### Actividad 6: Analítica y Mejora del Servicio

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Analítica de uso y mejora de servicios |
| **Descripción** | Análisis de patrones de uso para mejorar la plataforma, incluyendo IA para recomendaciones |
| **Base legal** | Interés legítimo (art. 6.1.f RGPD) |
| **Categorías de interesados** | Usuarios de la plataforma |
| **Categorías de datos** | - Datos de navegación (páginas visitadas, tiempo de uso)<br>- Datos de dispositivo (tipo, SO)<br>- Datos anonimizados para estadísticas |
| **Categorías de destinatarios** | - Personal interno de Appstracta<br>- OpenAI (para generación de recomendaciones, sin uso de datos personales para entrenamiento) |
| **Transferencias internacionales** | Sí, a OpenAI (cláusulas contractuales tipo) |
| **Plazos de conservación** | 24 meses (datos anonimizados tras 6 meses) |
| **Medidas de seguridad** | - Anonimización cuando es posible<br>- Sin identificación directa en análisis |

---

### Actividad 7: Recomendaciones con Inteligencia Artificial

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Sistema de recomendaciones de ofertas y candidatos |
| **Descripción** | Uso de IA para recomendar ofertas a trabajadores y candidatos a empresas |
| **Base legal** | Interés legítimo (art. 6.1.f RGPD) + Consentimiento (art. 6.1.a RGPD) |
| **Categorías de interesados** | - Trabajadores (recomendación de ofertas)<br>- Empresas (recomendación de trabajadores) |
| **Categorías de datos** | - Experiencia y habilidades<br>- Ubicación<br>- Preferencias laborales |
| **Categorías de destinatarios** | - OpenAI API (procesamiento, sin almacenamiento para entrenamiento) |
| **Transferencias internacionales** | Sí, a OpenAI (cláusulas contractuales tipo, privacy shield para datos anonimizados) |
| **Plazos de conservación** - No se almacenan datos de las consultas a OpenAI |
| **Medidas de seguridad** | - Sin datos identificativos en las peticiones a la API<br>- Respuestas cacheadas internamente |

---

### Actividad 8: Gestión de Denuncias y Moderación

| Campo | Descripción |
|-------|-------------|
| **Nombre de la actividad** | Sistema de denuncias y moderación de contenido |
| **Descripción** | Gestión de reportes por contenido inapropiado o incumplimiento de normas |
| **Base legal** | Interés legítimo (art. 6.1.f RGPD) + Obligación legal (art. 6.1.c RGPD) |
| **Categorías de interesados** | - Usuarios que denuncian<br>- Usuarios denunciados<br>- Contenido denunciado |
| **Categorías de datos** | - Motivo de la denuncia<br>- Autor de la denuncia<br>- Contenido afectado<br>- Resolución adoptada |
| **Categorías de destinatarios** | - Personal de moderación<br>- Firebase (Google LLC) |
| **Transferencias internacionales** | Sí, a Firebase/Google |
| **Plazos de conservación** | 3 años tras la resolución (para gestión de reincidencias) |
| **Medidas de seguridad** | - Acceso restringido a moderadores<br>- Sin exposición pública de denunciantes |

---

## 3. Medidas de Seguridad

### Técnicas
- Autenticación segura mediante Firebase Auth
- Conexiones HTTPS/TLS obligatorias
- Rate limiting en endpoints sensibles
- Validación y sanitización de inputs
- Copias de seguridad automatizadas
- Control de accesos por roles

### Organizativas
- Formación en RGPD del personal
- Acuerdo de confidencialidad
- Procedimiento de respuesta a incidentes
- Política de retención y eliminación

---

## 4. Delegado de Protección de Datos (DPO)

**¿Se ha designado un DPD?** No obligatorio (tratamiento no masivo ni de datos especiales sensibles)

**Contacto RGPD:** contact@appstracta.app

---

## 5. Registro de Ficheros (LOPD-GDD previa)

**Nota:** Desde la entrada en vigor del RGPD (2018), no es necesario comunicar los ficheros
a la AEPD. Este registro interno sustituye a la antigua notificación de ficheros.

---

## 6. Historial de Modificaciones

| Fecha | Modificación | Motivo |
|-------|--------------|--------|
| 25/02/2026 | Creación del registro | Inicio de actividad de Red Agro |

---

*Este documento es interno y debe estar disponible para la AEPD en caso de inspección.*
