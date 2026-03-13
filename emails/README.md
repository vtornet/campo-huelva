# Plantillas de Email - Agro Red

Plantillas HTML profesionales para emails de prospección y comunicación.

## 🎨 Colores de la Marca

| Color | Hex | Uso |
|-------|-----|-----|
| Emerald Primary | `#047857` | Empresas, acciones principales |
| Emerald Light | `#10b981` | Acentos positivos |
| Orange Primary | `#f97316` | Demandas/trabajadores, CTAs secundarios |
| Orange Dark | `#ea580c` | Hover states |
| Slate | `#64748b`, `#475569` | Texto secundario |
| Slate Light | `#f1f5f9`, `#f8fafc` | Fondos |

## 📧 Plantillas Disponibles

### 1. `plantilla-presentacion.html`
Email completo de presentación para empresas en general.

**Personalizaciones:**
- `[Nombre]` - Nombre del destinatario
- `[Nombre de la empresa]` - Empresa del prospecto
- `[provincia/sector]` - Ubicación o sector específico
- `[Tu Nombre]` - Tu nombre

### 2. `plantilla-ett.html`
Específico para Empresas de Trabajo Temporal (ETT).

**Personalizaciones:**
- `[fresa/berries/frutas]` - Cultivo específico
- `[Nombre]`, `[Tu Nombre]` - Igual que arriba

### 3. `firma-email.html`
Firma profesional para usar en todos tus emails salientes.

## 🚀 Cómo Usar con Resend

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: "Agro Red <contact@appstracta.app>",
  to: "prospecto@empresa.com",
  subject: "Agro Red - Tu red de empleo agrícola",
  html: `
    <!-- Contenido de plantilla-presentacion.html aquí -->
  `,
});
```

## ✅ Checklist Antes de Enviar

1. **Personalizar todas las variables** `[...]`
2. **Verificar que el email del destinatario es correcto**
3. **Probar enviándote a ti mismo primero**
4. **Revisar en móvil** (responsive)
5. **Revisar en Gmail, Outlook, Apple Mail**

## 📱 Responsive

Las plantillas están diseñadas para verse bien en:
- Desktop (600px ancho máximo)
- Tablet
- Móviles (adaptativo)

## 💡 Tips

- **Asunto cortos**: Máximo 50 caracteres
- **Un solo CTA**: Una sola acción clara
- **Personalizar**: Siempre menciona algo específico del prospecto
- **Seguimiento**: Si no responden en 3 días, enviar un follow-up breve
