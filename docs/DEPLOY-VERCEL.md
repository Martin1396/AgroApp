# Despliegue en Vercel — AgroApp

Dos proyectos: **frontend** (`agroapp-frontend`) y **backend** (`agroapp-backend`).

## Solución recomendada: proxy `/api` en el frontend

El navegador llama `https://tu-frontend.vercel.app/api/...` (mismo origen). Vercel reenvía al backend en el servidor.

- Sin CORS entre dominios
- Sin `ERR_CERT_AUTHORITY_INVALID` en el navegador (solo ve el certificado del frontend)

---

## 1. Backend (`agroapp-backend`)

| Ajuste | Valor |
|--------|--------|
| Root Directory | `agroapp-backend` |

### Variables

```
MYSQL_ADDON_URI=mysql://...
CORS_ORIGINS=https://agro-app-mqek.vercel.app,http://localhost:5173
CORS_ALLOW_VERCEL_PREVIEWS=true
DEVELOPER_CEDULA=...
DEVELOPER_PASSWORD=...
SESSION_TTL_DAYS=7
```

### Deployment Protection → **desactivar en Production**

Prueba: `https://TU-BACKEND.vercel.app/api/health` → `{"ok":true}` **sin login Vercel**.

---

## 2. Frontend (`agroapp-frontend`)

| Ajuste | Valor |
|--------|--------|
| Root Directory | `agroapp-frontend` |
| Build Command | `npm run build` (genera `vercel.json` + compila) |
| Output | `dist` |

### Variables en Vercel (Production + Preview)

| Variable | Valor | Uso |
|----------|--------|-----|
| `VITE_API_URL` | `/api` | URL que usa el bundle en el navegador |
| `VITE_API_BACKEND_URL` | `https://TU-BACKEND.vercel.app` | Solo build: proxy en `vercel.json` (sin `/api`) |

Ejemplo:

```
VITE_API_URL=/api
VITE_API_BACKEND_URL=https://agro-app-nine.vercel.app
```

Tras cambiar variables → **Redeploy** del frontend (Clear build cache).

### Deployment Protection → **desactivar en Production**

Si `manifest.webmanifest` da **401**, el sitio entero está protegido.

**Settings → Deployment Protection → Production → Off**

Prueba en incógnito: `https://agro-app-mqek.vercel.app` carga sin login Vercel.

---

## 3. Errores y causas

| Error | Causa | Acción |
|-------|--------|--------|
| `manifest.webmanifest` 401 | Protección Vercel en **frontend** | Desactivar Deployment Protection |
| `ERR_CERT_AUTHORITY_INVALID` | Llamada directa al dominio del backend | Usar `VITE_API_URL=/api` + proxy (ya configurado) |
| CORS / preflight 401 | Protección en **backend** o URL cruzada antigua | Desactivar protección backend + redeploy frontend |
| API 401 en OPTIONS | Protección backend | Igual que arriba |

---

## 4. Comprobar que funciona

1. Frontend en incógnito: abre la app, sin pantalla de login de Vercel.
2. DevTools → Network: las peticiones van a `https://tu-frontend.vercel.app/api/...` (no al dominio largo del backend).
3. Login debe responder 200 o 401 de credenciales (no error CORS ni certificado).

---

## 5. Local

```bash
# backend
cd agroapp-backend && npm run dev

# frontend (.env.development ya tiene VITE_API_URL=/api)
cd agroapp-frontend && npm run dev
```
