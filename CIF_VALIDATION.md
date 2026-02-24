# Validación de CIF/NIF Español

## Resumen

Se ha implementado un sistema completo de validación de documentos fiscales españoles (CIF, NIF, NIE) utilizando el algoritmo oficial de la Agencia Tributaria.

## Componentes implementados

### 1. Biblioteca de validación (`src/lib/cif-validator.ts`)

Funciones principales:

- `validateCIF(cif)` - Valida un CIF usando el algoritmo oficial
- `validateNIF(nif)` - Valida un NIF (DNI)
- `validateNIE(nie)` - Valida un NIE de extranjero
- `validateSpanishDocument(doc)` - Valida cualquiera de los tres tipos
- `identifyDocumentType(doc)` - Identifica si es CIF, NIF o NIE
- `formatCIF(cif)` - Formatea un CIF (ej: "B-12345678")
- `getEntityTypeName(type)` - Obtiene el nombre del tipo de entidad

### 2. Componente React (`src/components/CifInput.tsx`)

Componente de input con validación en tiempo real:

```tsx
<CifInput
  label="CIF *"
  placeholder="Ej: B12345678"
  value={formData.cif}
  companiesOnly={true}  // Solo acepta CIF de empresas
  onValidChange={(valid, cif) => {
    console.log('Válido:', valid, 'CIF:', cif);
  }}
/>
```

**Características:**
- ✅ Validación en tiempo real mientras se escribe
- ✅ Indicador visual (✓ verde / ✗ rojo)
- ✅ Badge con el tipo de documento detectado (CIF/NIF/NIE)
- ✅ Formateo automático al perder el foco
- ✅ Mensajes de error específicos
- ✅ Soporte para componentes controlados y no controlados

### 3. API de validación (`/api/validate/cif`)

**GET** - Validar un CIF:
```
GET /api/validate/cif?cif=B12345678
```

Respuesta:
```json
{
  "valid": true,
  "documentType": "CIF",
  "entityType": "SOCIEDAD_LIMITADA",
  "entityTypeName": "Sociedad Limitada (S.L.)",
  "typeLetter": "B",
  "provinceCode": "12",
  "formattedCif": "B-12345678"
}
```

**POST** - Validar múltiples CIFs (batch):
```
POST /api/validate/cif
{
  "cifs": ["B12345678", "A87654321", "X1234567L"]
}
```

Respuesta:
```json
{
  "results": [...],
  "summary": {
    "total": 3,
    "valid": 2,
    "invalid": 1
  }
}
```

## Integración en el formulario de empresa

El formulario de perfil de empresa (`/profile/company`) ahora:

1. ✅ Valida el CIF en tiempo real mientras el usuario escribe
2. ✅ Muestra feedback visual inmediato
3. ✅ Previene el envío si el CIF no es válido
4. ✅ Solo acepta CIF de empresas (no NIF/NIE de personas físicas)

## Algoritmo de validación

### Cálculo del dígito de control del CIF:

1. Sumar los dígitos en posiciones pares
2. Para cada dígito en posición impar:
   - Multiplicar por 2
   - Sumar las cifras del resultado
3. Sumar ambos resultados
4. Obtener las unidades de la suma
5. Dígito de control = 10 - unidades (si es 10, entonces 0)

### Letras de tipo de entidad:

| Letra | Tipo |
|-------|------|
| A | Sociedad Anónima |
| B | Sociedad Limitada |
| C | Sociedad Comanditaria / Cooperativa / Civil |
| D | Fondos |
| E | Comunidad de Bienes |
| F | Fundación |
| G | Asociación |
| N | Extranjero |
| P | Administración Pública |
| Q | Centro de Gestión |
| S | Sociedad Laboral |
| U | Unión Temporal de Empresas |

## Limitaciones

La validación local **verifica el formato** del CIF pero **no confirma** que:

- La empresa existe realmente
- El CIF está activo en Hacienda
- La razón social coincide con el CIF

Para verificación completa, se necesitaría integrar con:
- API de la Agencia Tributaria (requiere certificado digital)
- API de terceros (Covapi, Informa, Axesor, etc.)

## Próximos pasos (opcional)

1. **API de Hacienda**: Integrar con servicio oficial de la AEAT
2. **API de terceros**: Usar Covapi o similar para verificación real
3. **Cache**: Guardar CIFs validados para reducir peticiones
4. **Rate limiting**: Ajustar límites según necesidades reales
