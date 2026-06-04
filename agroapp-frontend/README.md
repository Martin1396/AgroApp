# AgroApp Frontend

PWA React con la misma UI y estilos del proyecto `lll`, conectada al backend vía API REST.

## Desarrollo

```bash
npm install
npm run dev
```

Con el backend en `http://localhost:3001` (`npm run dev` en `agroapp-backend`):

- `.env.development` usa `VITE_API_URL=/api` y el **proxy de Vite** reenvía a `localhost:3001`.

## Build y producción

```bash
npm run build
```

- `.env.production` apunta a la API en Vercel:
  `https://agro-app-git-main-martin-arbelaez-s-projects.vercel.app/api`

### Deploy del frontend en Vercel

Guía completa: [`docs/DEPLOY-VERCEL.md`](../docs/DEPLOY-VERCEL.md)

1. **Root Directory:** `agroapp-frontend`
2. **Deployment Protection:** desactivada en **Production** (evita 401 en `manifest.webmanifest`).
3. Variables en Vercel:

   | Variable | Valor |
   |----------|--------|
   | `VITE_API_URL` | `/api` |
   | `VITE_API_BACKEND_URL` | `https://TU-BACKEND.vercel.app` (sin `/api`) |

4. **Redeploy** del frontend tras guardar variables.

## Variables

| Archivo | Cuándo | `VITE_API_URL` |
|---------|--------|----------------|
| `.env.development` | `npm run dev` | `/api` (proxy → local) |
| `.env.production` | `npm run build` | URL del backend en Vercel |
| `.env.local` | override personal (no se sube a git) | la que necesites |
