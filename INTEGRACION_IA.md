# Integración de IA con Google Gemini

Esta documentación describe la integración de Google Gemini en Red Agro para proporcionar funciones de inteligencia artificial.

## Configuración

### Variable de entorno

Añade la siguiente variable a tu archivo `.env.local`:

```bash
GEMINI_API_KEY=tu_api_key_aqui
```

Para obtener una API Key:
1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Ve a "API Keys" y crea una nueva clave
4. Copia la clave y pégala en tu `.env.local`

### Instalación

El SDK ya está instalado:
```bash
npm install @google/generative-ai
```

## Funcionalidades implementadas

### 1. Generación de descripciones de perfil

**Endpoint:** `POST /api/ai/profile-description`

Genera descripciones profesionales para:
- **Trabajadores**: Destaca experiencia, habilidades y disponibilidad
- **Manijeros**: Enfatiza liderazgo, tamaño de cuadrilla y recursos
- **Ingenieros**: Muestra formación, especialidades y servicios

**Uso:**
```typescript
const response = await fetch('/api/ai/profile-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rol: 'USER', // o 'FOREMAN', 'ENGINEER'
    fullName: 'Juan Pérez',
    experience: ['Fresa', 'Cítricos'],
    hasVehicle: true,
    // ... otros datos del perfil
  }),
});
const { descripcion } = await response.json();
```

### 2. Recomendación de ofertas para trabajadores

**Endpoint:** `POST /api/ai/recommend-offers`

Recomienda las mejores ofertas de trabajo para un trabajador basándose en su perfil.

**Uso:**
```typescript
const response = await fetch('/api/ai/recommend-offers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'uid_del_usuario',
  }),
});
const { offers } = await response.json();
```

### 3. Recomendación de trabajadores para empresas

**Endpoint:** `POST /api/ai/recommend-workers`

Recomienda los mejores trabajadores para una oferta específica.

**Uso:**
```typescript
const response = await fetch('/api/ai/recommend-workers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    postId: 'id_de_la_oferta',
    companyId: 'id_de_la_empresa', // opcional, para verificar permisos
  }),
});
const { workers } = await response.json();
```

### 4. Mejora de descripciones de ofertas

**Endpoint:** `POST /api/ai/improve-offer`

Mejora la descripción de una oferta para hacerla más atractiva.

**Uso:**
```typescript
const response = await fetch('/api/ai/improve-offer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    titulo: 'Recolectores de fresa',
    descripcion: 'Se necesitan personas para recoger fresas...',
    provincia: 'Huelva',
    tipo: 'OFICIAL',
  }),
});
const { improved } = await response.json();
```

## Componentes de React

### AIBioGenerator

Componente de textarea con botón para generar bio con IA:

```tsx
import AIBioGenerator from '@/components/AIBioGenerator';

<AIBioGenerator
  value={bio}
  onChange={(value) => setBio(value)}
  rol="USER"
  profileData={{
    fullName: 'Juan Pérez',
    experience: ['Fresa', 'Cítricos'],
    hasVehicle: true,
  }}
  placeholder="Describe tu experiencia..."
  label="Sobre ti"
/>
```

### AIButton

Botón estilizado con gradiente púrpura/índigo para acciones de IA:

```tsx
import AIButton from '@/components/AIButton';

<AIButton
  onClick={handleGenerar}
  loading={isLoading}
  label="Generar con IA"
/>
```

### useAI Hook

Hook personalizado para interactuar con las funciones de IA:

```tsx
import { useAI } from '@/hooks/useAI';

function MiComponente() {
  const { generarDescripcion, loading, error } = useAI();

  const handleGenerar = async () => {
    const descripcion = await generarDescripcion({
      rol: 'USER',
      fullName: 'Juan Pérez',
      experience: ['Fresa'],
    });
    if (descripcion) {
      setBio(descripcion);
    }
  };

  return (
    <button onClick={handleGenerar} disabled={loading}>
      Generar
    </button>
  );
}
```

## Archivos

- `src/lib/gemini.ts` - Cliente de Gemini y funciones de IA
- `src/app/api/ai/profile-description/route.ts` - API de generación de descripciones
- `src/app/api/ai/recommend-offers/route.ts` - API de recomendación de ofertas
- `src/app/api/ai/recommend-workers/route.ts` - API de recomendación de trabajadores
- `src/app/api/ai/improve-offer/route.ts` - API de mejora de ofertas
- `src/components/AIBioGenerator.tsx` - Componente de generación de bio
- `src/components/AIButton.tsx` - Botón de IA
- `src/hooks/useAI.ts` - Hook de IA

## Límites de uso (Tier gratuito de Gemini)

- ~1,500 requests por día
- ~15 requests por segundo
- Sin coste y sin tarjeta de crédito

### Sistema de Caché Implementado

Para optimizar el uso de la API, se ha implementado un sistema de caché inteligente en `src/lib/ai-cache.ts`:

| Tipo de caché | TTL | Descripción |
|--------------|-----|-------------|
| `PROFILE_DESCRIPTION` | 24 horas | Descripciones de perfil generadas |
| `RECOMMEND_OFFERS` | 30 minutos | Recomendaciones de ofertas para trabajadores |
| `RECOMMEND_WORKERS` | 30 minutos | Recomendaciones de trabajadores para empresas |
| `IMPROVE_OFFER` | 1 hora | Descripciones de ofertas mejoradas |

**Características del caché:**
- Claves basadas en hash del contenido (mismo input = mismo output)
- Limpieza automática de entradas antiguas
- Límite de 500 entradas para evitar uso excesivo de memoria
- Logs en consola para debug (`[AI Cache] HIT`, `[AI Cache] SET`)

**Ver estadísticas del caché:**
```typescript
GET /api/ai/cache/stats
```

Si se exceden los límites de Gemini, las funciones devolverán un error. El caché reduce significativamente el número de llamadas a la API.
