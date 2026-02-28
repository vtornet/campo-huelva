# Configuración de Resend para envío de emails

## Pasos para configurar:

### 1. Crear cuenta en Resend
1. Ve a https://resend.com/signup
2. Regístrate con tu email (contact@appstracta.app)
3. Verifica tu email

### 2. Obtener API Key
1. Ve a https://resend.com/api-keys
2. Haz clic en "Create API Key"
3. Dale un nombre (ej: "Agro Red Contact")
4. Copia la API key generada

### 3. Configurar dominio remitente
1. Ve a https://resend.com/domains
2. Añade tu dominio: `agroredjob.com`
3. Configura los registros DNS:
   ```
   Tipo: TXT
   Nombre: _dmarc
   Valor: v=DMARC1; p=none
   ```
4. O usa el dominio por defecto de Resend (`@resend.dev`)

### 4. Añadir variable de entorno

**En Railway:**
1. Ve a tu proyecto
2. Settings → Variables
3. Añade:
   - Key: `RESEND_API_KEY`
   - Value: `re_xxxxxxxxxxxxx` (la API key que copiaste)

**En local (.env):**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 5. Verificar
Envía un mensaje de prueba desde /contact y revisa que llegue a contact@appstracta.app

---

## Alternativa: Usar dominio Resend (más rápido)

Si no quieres configurar DNS, usa el dominio por defecto de Resend:

Cambia en `src/app/api/contact/route.ts`:
```typescript
from: 'Agro Red <noreply@agroredjob.com>',
```

Por:
```typescript
from: 'Agro Red <onboarding@resend.dev>',
```

Esto funciona inmediatamente sin configurar DNS.
