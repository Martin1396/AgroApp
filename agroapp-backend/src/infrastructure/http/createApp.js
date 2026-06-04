import express from 'express'
import { corsMiddleware, corsOptions, isAllowedCorsOrigin } from './corsConfig.js'
import cors from 'cors'

export function createApp(router) {
  const app = express()

  app.use(corsMiddleware)
  app.options(/.*/, cors(corsOptions))

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
  app.use((err, req, res, _next) => {
    console.error(err)
    if (req.headers.origin && isAllowedCorsOrigin(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
    res.status(err.status || 500).json({ error: err.message || 'Error interno' })
  })
  return app
}
