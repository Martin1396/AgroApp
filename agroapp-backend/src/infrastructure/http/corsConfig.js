import cors from 'cors'
import { env } from '../../config/env.js'

const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

export function isVercelAgroAppFrontend(origin) {
  if (!env.corsAllowVercelPreviews) return false
  try {
    const { protocol, hostname } = new URL(origin)
    return protocol === 'https:' && hostname.endsWith('.vercel.app') && hostname.startsWith('agro-app')
  } catch {
    return false
  }
}

export function isAllowedCorsOrigin(origin) {
  if (!origin) return true
  const allowed = new Set([...env.corsOrigins, ...LOCAL_DEV_ORIGINS])
  return allowed.has(origin) || isVercelAgroAppFrontend(origin)
}

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedCorsOrigin(origin)) {
      callback(null, origin || true)
    } else {
      callback(null, false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

export const corsMiddleware = cors(corsOptions)
