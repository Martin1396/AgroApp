import express from 'express'
import cors from 'cors'
import { env } from '../../config/env.js'

const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

export function createApp(router) {
  const app = express()
  app.use(
    cors({
      origin(origin, callback) {
        const allowed = new Set([env.corsOrigin, ...LOCAL_DEV_ORIGINS])
        if (!origin || allowed.has(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '2mb' }))
  app.get('/', (_req, res) => {
    res.json({
      name: 'AgroApp API',
      ok: true,
      message: 'API en línea. Usa /api para los recursos.',
      health: '/api/health',
    })
  })
  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api', router)
  app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.path })
  })
  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Error interno' })
  })
  return app
}
