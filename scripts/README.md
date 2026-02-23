# Scripts de Utilidad

## create-test-users-simple.js

Script para crear usuarios de prueba para E2E Testing.

### Uso

```bash
# 1. Asegúrate de tener el servidor corriendo
npm run dev

# 2. En otra terminal, ejecuta el script
npm run test:users:create
# o directamente
node scripts/create-test-users-simple.js
```

### Usuarios Creados

| Rol | Email | Password |
|-----|-------|----------|
| WORKER | test-worker@example.com | Test123456! |
| FOREMAN | test-foreman@example.com | Test123456! |
| ENGINEER | test-engineer@example.com | Test123456! |
| ENCARGADO | test-encargado@example.com | Test123456! |
| TRACTORISTA | test-tractorista@example.com | Test123456! |
| COMPANY | test-company@example.com | Test123456! |
| ADMIN | test-admin@example.com | Test123456! |

### Archivos Generados

- `.env.test` - Variables de entorno para Playwright

### Requisitos

- Servidor de desarrollo corriendo (`npm run dev`)
- Variables de entorno de Firebase configuradas en `.env.local`
- Conexión a internet (para Firebase REST API)

### Notas

- Si el usuario ya existe en Firebase, se reutiliza el UID existente
- Los usuarios se crean con email verificado automáticamente
- El script también registra los usuarios en Prisma a través de `/api/register`
