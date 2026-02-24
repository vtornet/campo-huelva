# Verificación de Empresas con AEAT

## Resumen

Se ha implementado un sistema de verificación de empresas que utiliza la **Agencia Tributaria (AEAT)** como fuente principal, con **fallback automático** a validación local cuando el servicio no está disponible.

## Flujo de Verificación

```
┌─────────────────┐
│  Usuario ingresa │
│     CIF          │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│ Validación local │
│   (algoritmo)    │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐       ¿Configurado?
│    Intentar     │─────────────┐
│   API de AEAT   │             No
└────────┬─────────┘
         │ Sí
         ▼
┌─────────────────┐       ┌──────────────┐
│ Verificación OK │       │  Fallback:   │
│   + Datos AEAT   │       │  Solo formato│
└─────────────────┘       └──────────────┘
```

## Componentes Implementados

### 1. Servicio AEAT (`src/lib/aeat-service.ts`)

Función principal: `verifyCompany(cif)`

```typescript
const result = await verifyCompany("B12345678");
// {
//   success: true,
//   method: "AEAT" | "LOCAL",
//   company: {
//     cif: "B12345678",
//     razonSocial: "EMPRESA S.L.",
//     direccion: "Calle Ejemplo 123",
//     localidad: "Huelva",
//     provincia: "Huelva",
//     codigoPostal: "21001",
//     situacion: "Activa"
//   }
// }
```

### 2. API de Verificación (`/api/companies/verify`)

**POST** - Verificar empresa:
```bash
POST /api/companies/verify
{
  "cif": "B12345678"
}
```

Respuesta exitosa:
```json
{
  "success": true,
  "method": "AEAT",
  "aeatConfigured": true,
  "company": {
    "razonSocial": "EMPRESA S.L.",
    "direccion": "Calle Ejemplo 123",
    ...
  }
}
```

**GET** - Estado del servicio:
```bash
GET /api/companies/verify
```

```json
{
  "aeatConfigured": false,
  "aeatAvailable": true,
  "methods": {
    "aeat": false,
    "local": true
  }
}
```

### 3. Componente UI (`src/components/CompanyVerification.tsx`)

Componente React para el formulario de empresa:

```tsx
<CompanyVerification
  cif={formData.cif}
  onVerified={(data) => {
    console.log("Empresa verificada:", data.razonSocial);
  }}
/>
```

Características:
- 🔍 Botón de verificación
- ⏳ Indicador de carga
- ✅ Badge de método usado (AEAT / Local)
- 📋 Auto-llenado de campos con datos AEAT
- ⚠️ Avisos cuando AEAT no está configurado

### 4. Actualización del Modelo de Datos

Nuevos campos en `CompanyProfile`:

```prisma
model CompanyProfile {
  // ... campos existentes ...

  // Verificación de empresa
  isVerified           Boolean  @default(false)
  verificationMethod   String?  // "AEAT" o "MANUAL"
  aeatRazonSocial      String?
  aeatDireccion        String?
  aeatLocalidad        String?
  aeatProvincia        String?
  aeatCodigoPostal     String?
  aeatSituacion        String?
  aeatVerifiedAt       DateTime?
  aeatLastCheck        DateTime?
}
```

## Configuración

### Variables de Entorno

Añadir al `.env`:

```bash
# AEAT - Agencia Tributaria
# Certificado digital en formato PEM
AEAT_CERT_PEM="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
AEAT_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# O ruta al archivo de certificado
# AEAT_CERT_PATH=/ruta/al/certificado.p12
```

### Obtener el Certificado Digital

1. **Solicitar certificado** en:
   - FNMT (Fábrica Nacional de Moneda y Timbre)
   - O entidad autorizada

2. **Convertir a PEM** (si es necesario):
   ```bash
   openssl pkcs12 -in certificado.p12 -out certificado.pem -nodes
   ```

3. **Extraer certificado y clave**:
   ```bash
   # Certificado
   openssl pkcs12 -in certificado.p12 -clcerts -nokeys -out cert.pem

   # Clave privada
   openssl pkcs12 -in certificado.p12 -nocerts -out key.pem
   ```

## Flujo en el Formulario

1. Usuario ingresa CIF → Se valida formato localmente
2. Si CIF válido → Aparece botón "🔍 Verificar empresa"
3. Al hacer clic:
   - Se llama a `/api/companies/verify`
   - Si AEAT está configurado → Verificación oficial
   - Si AEAT no está configurado → Fallback a validación local
4. Si verificación exitosa:
   - ✅ Se muestran los datos de la empresa
   - 📋 Se auto-llenan los campos del formulario
   - 💾 Se guarda el método de verificación

## Modificación Manual por Admin

Los administradores pueden modificar la verificación:

1. **Ver manualmente** una empresa desde el panel de admin
2. **Marcar como verificada** incluso si AEAT falló
3. **Editar datos** de verificación guardados

## Limitaciones Actuales

### Sin Certificado Digital

Si no hay certificado configurado:
- ✅ El sistema sigue funcionando
- ⚠️ Solo valida el formato del CIF
- ℹ️ Muestra aviso de que AEAT no está configurado

### Comunicación SOAP

La implementación actual usa `fetch` con protocolo SOAP.
Para producción, se recomienda:
- Usar librería SOAP como `soap` o `strong-soap`
- Configurar el certificado cliente correctamente
- Implementar reintentos y timeouts

## Próximos Pasos

1. **Obtener certificado digital** para producción
2. **Probar con SOAP real** de la AEAT
3. **Implementar caché** de empresas verificadas
4. **Añadir reintentos automáticos** si AEAT falla temporalmente
5. **Dashboard de admin** para ver empresas pendientes de verificación

## Referencias

- [AEAT - Web Services](https://www.agenciatributaria.es/static_files/AEAT/Contenido_Importante/Seguridad/Publicos_code_Sumario/informacion_general/Web_Services/WebServices.html)
- [Servicio de Verificación de Identidad](https://www1.agenciatributaria.es/wlpl/SSII-FACT/ws/soiap/WSServlet02)
