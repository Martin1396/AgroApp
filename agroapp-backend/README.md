# AgroApp Backend

API REST con **arquitectura hexagonal** para AgroApp (Turpial Dorado).

## Capas

| Capa | Carpeta | Rol |
|------|---------|-----|
| Dominio / aplicación | `src/application/` | Casos de uso (`AuthService`, `ProductionService`) y puertos |
| Infraestructura | `src/infrastructure/` | Adaptadores HTTP (Express) y MySQL |
| Configuración | `src/config/` | Variables de entorno |

## Base de datos (Clever Cloud)

1. Crea un add-on **MySQL** en Clever Cloud y vincúlalo a la app.
2. Importa `database/turpial_dorado_clevercloud.sql` en phpMyAdmin (sin `CREATE DATABASE`).
3. Las variables `MYSQL_ADDON_*` se inyectan automáticamente en producción.

## Desarrollo local

```bash
cp .env.example .env
# Edita MYSQL_ADDON_* según tu MySQL local
npm install
npm run dev
```

API: `http://localhost:3001/api/health`

## Despliegue

### Clever Cloud (Node.js)

- `npm start` en Clever Cloud (Node.js app).
- Configura `CORS_ORIGINS` con la URL del frontend en Vercel (ej. `https://agro-app-mqek.vercel.app,http://localhost:5173`).
- `DEVELOPER_CEDULA` / `DEVELOPER_PASSWORD` para la cuenta de desarrollador (no en BD).

### Vercel (serverless)

1. En Vercel, **Root Directory** = `agroapp-backend` (no el monorepo completo).
2. Framework Preset: **Other** (o detección automática de Express).
3. Variables de entorno: `MYSQL_ADDON_URI` (o `MYSQL_ADDON_*`), `DEVELOPER_*`, `SESSION_TTL_DAYS`.
4. **CORS** (obligatorio si el frontend está en otro dominio):

   | Variable | Ejemplo |
   |----------|---------|
   | `CORS_ORIGINS` | `https://agro-app-mqek.vercel.app,http://localhost:5173` |
   | `CORS_ALLOW_VERCEL_PREVIEWS` | `true` |

5. **Deployment Protection:** en el proyecto del **backend**, desactiva *Vercel Authentication* / protección del deployment en **Production**. Si está activa, el preflight `OPTIONS` responde **401** sin cabeceras CORS (el error que ves en el navegador).
6. El entrypoint `src/index.js` exporta la app Express (`export default`) e importa `express`.
7. Tras el deploy, prueba `https://tu-api.vercel.app/api/health`.
