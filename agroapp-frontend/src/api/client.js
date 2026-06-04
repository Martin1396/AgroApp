const TOKEN_KEY = 'agroapp_token'

/**
 * En Vercel el frontend debe usar /api (mismo origen + proxy en vercel.json).
 * Evita CORS y llamadas directas al dominio del backend en builds antiguos.
 */
export function getApiBase() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (
      hostname === 'agro-app-mqek.vercel.app' ||
      hostname.startsWith('agro-app-mqek')
    ) {
      return '/api'
    }
  }

  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:3001/api'
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const apiBase = getApiBase()
  const headers = { ...(options.headers || {}) }
  const hasBody = options.body !== undefined
  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Error de API')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}
