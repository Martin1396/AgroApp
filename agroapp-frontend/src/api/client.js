const TOKEN_KEY = 'agroapp_token'

/** Evita peticiones GET duplicadas en paralelo (React StrictMode, varios useEffect). */
const inFlightGet = new Map()

/**
 * En Vercel el frontend debe usar /api (mismo origen + proxy en vercel.json).
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
  const method = (options.method || 'GET').toUpperCase()
  const dedupeGet = method === 'GET' && options.dedupe !== false
  const flightKey = dedupeGet ? `GET ${path}` : null

  if (flightKey && inFlightGet.has(flightKey)) {
    return inFlightGet.get(flightKey)
  }

  const run = async () => {
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
      method,
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

  const promise = run()
  if (flightKey) {
    inFlightGet.set(flightKey, promise)
    promise.finally(() => {
      if (inFlightGet.get(flightKey) === promise) {
        inFlightGet.delete(flightKey)
      }
    })
  }

  return promise
}
