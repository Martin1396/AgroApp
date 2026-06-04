import { isDeveloperCedula } from '../constants/auth'
import { apiRequest, getToken, setToken } from '../api/client'

const SESSION_KEY = 'agroapp_session'

export function resolveSessionUser(session) {
  if (!session) return null
  return session
}

export function saveSession(user, token) {
  const payload = { ...user }
  if (token) setToken(token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

export function getSession() {
  try {
    const data = localStorage.getItem(SESSION_KEY)
    if (!data) return null
    const parsed = JSON.parse(data)
    if (!getToken() && !isDeveloperCedula(parsed?.cedula)) return null
    return resolveSessionUser(parsed)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  setToken(null)
}

export async function restoreSessionFromApi() {
  if (!getToken()) return null
  try {
    const { user } = await apiRequest('/auth/me')
    saveSession(user)
    return user
  } catch {
    clearSession()
    return null
  }
}

export function buildDisplayName(user) {
  if (user?.nombre || user?.apellido) {
    return [user.nombre, user.apellido].filter(Boolean).join(' ')
  }
  return user?.cedula || user?.usuario || 'Usuario'
}
