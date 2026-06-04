import crypto from 'crypto'
import { env } from '../../config/env.js'

const SECRET = process.env.SESSION_DEV_SECRET || 'agroapp-dev-session-local'
const TTL_MS = () => (env.sessionTtlDays || 7) * 24 * 60 * 60 * 1000

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verify(token) {
  if (!token || !token.startsWith('dev.')) return null
  const raw = token.slice(4)
  const [body, sig] = raw.split('.')
  if (!body || !sig) return null
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  if (sig !== expected) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    if (payload.cedula !== env.developer.cedula) return null
    return payload
  } catch {
    return null
  }
}

export function createDeveloperToken() {
  const payload = {
    cedula: env.developer.cedula,
    exp: Date.now() + TTL_MS(),
  }
  return `dev.${sign(payload)}`
}

export function parseDeveloperToken(token) {
  return verify(token)
}

export function isDeveloperToken(token) {
  return Boolean(token && token.startsWith('dev.'))
}
