# AgroApp Frontend

PWA React con la misma UI y estilos del proyecto `lll`, conectada al backend vía API REST.

## Desarrollo

```bash
cp .env.example .env
npm install
npm run dev
```

Por defecto la API está en `http://localhost:3001/api`. El proxy de Vite también expone `/api` en desarrollo.

## Build

```bash
npm run build
npm run preview
```

## Variables

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `https://tu-api.cleverapps.io/api`) |
