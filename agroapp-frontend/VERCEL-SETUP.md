# Checklist Vercel — errores 401 y CORS

Si ves en la consola:

- `manifest.webmanifest` → **401**
- Llamadas a `agro-app-git-main-....vercel.app/api/...` → **CORS**

sigue estos pasos **en orden**.

---

## A. Proyecto FRONTEND (agro-app-mqek)

### 1. Desactivar protección (obligatorio)

**Settings → Deployment Protection**

- **Production:** OFF  
- **Preview:** OFF (recomendado, para URLs `agro-app-mqek-7odm14o2f-...`)

Sin esto, **todo** el sitio (incluido `manifest.webmanifest`) responde 401.

### 2. Variables de entorno

En **Production** y **Preview**:

| Variable | Valor |
|----------|--------|
| `VITE_API_URL` | `/api` |
| `VITE_API_BACKEND_URL` | `https://agro-app-nine.vercel.app` |

Borra variables antiguas que tengan la URL completa del backend en `VITE_API_URL`.

### 3. Redeploy

**Deployments → Redeploy** (activar **Clear build cache**).

### 4. Comprobar

Abre la app en incógnito. En **Network**, las peticiones deben ser:

`https://agro-app-mqek-....vercel.app/api/company`

**No** deben ir directo a `agro-app-nine.vercel.app` (solo el proxy de Vercel).

---

## B. Proyecto BACKEND (agro-app-nine)

### 1. Desactivar protección en Production

**Settings → Deployment Protection → Production → OFF**

Prueba: `https://agro-app-nine.vercel.app/api/health`  
→ `{"ok":true}` sin pantalla de login de Vercel.

### 2. Variables

```
CORS_ORIGINS=https://agro-app-mqek.vercel.app,http://localhost:5173
CORS_ALLOW_VERCEL_PREVIEWS=true
MYSQL_ADDON_URI=...
```

### 3. Redeploy del backend

---

## C. Error 500 en `/api/company`

Suele ser **MySQL** (conexiones agotadas o BD caída).

1. Backend Vercel → variable `MYSQL_POOL_LIMIT` = `1`
2. Redeploy backend (código con pool reducido)
3. Prueba: `https://tu-frontend.vercel.app/api/health/db`
   - `{"ok":true}` = BD bien
   - `503` + mensaje `max_user_connections` = espera 30 s o cierra otras conexiones a Clever Cloud

## D. Código reciente

- Frontend: `/api` en mismo dominio
- Backend: si falla BD, `/api/company` devuelve configuración por defecto (no 500)

Haz **push** y redeploy de **ambos** proyectos.
