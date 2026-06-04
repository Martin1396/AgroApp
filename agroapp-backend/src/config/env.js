import dotenv from 'dotenv'

dotenv.config()

function parseMysqlAddonUri(uri) {
  if (!uri) return null
  try {
    const u = new URL(uri)
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      database: u.pathname?.replace(/^\//, '') || undefined,
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
    }
  } catch {
    return null
  }
}

const fromUri = parseMysqlAddonUri(process.env.MYSQL_ADDON_URI)

export const env = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  db: {
    host: process.env.MYSQL_ADDON_HOST || fromUri?.host || 'localhost',
    port: Number(process.env.MYSQL_ADDON_PORT) || fromUri?.port || 3306,
    database: process.env.MYSQL_ADDON_DB || fromUri?.database || 'agroapp',
    user: process.env.MYSQL_ADDON_USER || fromUri?.user || 'root',
    password: process.env.MYSQL_ADDON_PASSWORD || fromUri?.password || '',
  },
  developer: {
    cedula: process.env.DEVELOPER_CEDULA || '1036401824',
    password: process.env.DEVELOPER_PASSWORD || '12041396',
    nombre: process.env.DEVELOPER_NOMBRE || 'Martin',
    apellido: process.env.DEVELOPER_APELLIDO || 'Arbelaez',
  },
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS) || 7,
}
