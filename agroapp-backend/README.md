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

- `npm start` en Clever Cloud (Node.js app).
- Configura `CORS_ORIGIN` con la URL del frontend PWA.
- `DEVELOPER_CEDULA` / `DEVELOPER_PASSWORD` para la cuenta de desarrollador (no en BD).
