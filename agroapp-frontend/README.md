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

1. **Root Directory:** `agroapp-frontend`
2. Variable (opcional si ya está en `.env.production`):

   | Variable | Valor |
   |----------|--------|
   | `VITE_API_URL` | `https://agro-app-git-main-martin-arbelaez-s-projects.vercel.app/api` |

3. En el **backend** (Vercel), configura CORS con la URL de tu frontend:

   | Variable | Valor |
   |----------|--------|
   | `CORS_ORIGIN` | `https://tu-frontend.vercel.app` (sin `/` al final) |

## Variables

| Archivo | Cuándo | `VITE_API_URL` |
|---------|--------|----------------|
| `.env.development` | `npm run dev` | `/api` (proxy → local) |
| `.env.production` | `npm run build` | URL del backend en Vercel |
| `.env.local` | override personal (no se sube a git) | la que necesites |
