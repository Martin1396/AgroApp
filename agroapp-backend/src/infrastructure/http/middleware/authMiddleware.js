export function createAuthMiddleware(authService, sessionRepo) {
  return async function authMiddleware(req, res, next) {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204)
    }

    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    try {
      const devUser = authService.resolveDeveloperFromToken(token)
      if (devUser) {
        req.user = devUser
        return next()
      }

      const sessionRow = await sessionRepo.findValidByToken(token)
      if (!sessionRow) {
        return res.status(401).json({ error: 'Sesión inválida o expirada' })
      }
      req.user = await authService.resolveSessionUser(sessionRow, token)
      next()
    } catch (err) {
      next(err)
    }
  }
}
