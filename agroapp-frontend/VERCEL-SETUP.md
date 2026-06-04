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
| `VITE_API_BACKEND_URL` | `https://agro-app-git-main-martin-arbelaez-s-projects.vercel.app` |

Borra variables antiguas que tengan la URL completa del backend en `VITE_API_URL`.

### 3. Redeploy

**Deployments → Redeploy** (activar **Clear build cache**).

### 4. Comprobar

Abre la app en incógnito. En **Network**, las peticiones deben ser:

`https://agro-app-mqek-....vercel.app/api/company`

**No** deben ir a `agro-app-git-main-....vercel.app`.

---

## B. Proyecto BACKEND (agro-app-git-main)

### 1. Desactivar protección en Production

**Settings → Deployment Protection → Production → OFF**

Prueba: `https://agro-app-git-main-martin-arbelaez-s-projects.vercel.app/api/health`  
→ `{"ok":true}` sin pantalla de login de Vercel.

### 2. Variables

```
CORS_ORIGINS=https://agro-app-mqek.vercel.app,http://localhost:5173
CORS_ALLOW_VERCEL_PREVIEWS=true
MYSQL_ADDON_URI=...
```

### 3. Redeploy del backend

---

## C. Código reciente

El frontend fuerza `/api` cuando el host empieza por `agro-app-mqek` (incluso si el build tenía la URL vieja). Haz **push** y redeploy para aplicar todo.
