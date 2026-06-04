import { isDeveloperCedula } from '../constants/auth'
import { getDeveloperAccount } from './users'

const SESSION_KEY = 'turpial_session'

/** Alinea la sesión con la cuenta de desarrollador si la cédula corresponde */
export function resolveSessionUser(session) {
  if (!session) return null
  if (isDeveloperCedula(session.cedula)) {
    const dev = getDeveloperAccount()
    return {
      nombre: dev.nombre,
      apellido: dev.apellido,
      cedula: dev.cedula,
      role: dev.role,
    }
  }
  return session
}

export function saveSession(user) {
  const resolved = resolveSessionUser(user) ?? user
  localStorage.setItem(SESSION_KEY, JSON.stringify(resolved))
}

export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return null
    return resolveSessionUser(JSON.parse(data))
  } catch {
    return null
  }
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function buildDisplayName(user) {
  if (user?.nombre || user?.apellido) {
    return [user.nombre, user.apellido].filter(Boolean).join(' ')
  }
  return user?.cedula || user?.usuario || 'Usuario'
}
