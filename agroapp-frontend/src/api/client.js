const TOKEN_KEY = 'agroapp_token'

/** Evita peticiones GET duplicadas en paralelo (React StrictMode, varios useEffect). */
const inFlightGet = new Map()

/** Una petición a la vez desde el navegador (Clever Cloud: máx. 5 conexiones MySQL). */
let apiChain = Promise.resolve()

function enqueueApi(fn) {
  const result = apiChain.then(() => fn())
  apiChain = result.catch(() => {})
  return result
}

/**
 * En Vercel el frontend debe usar /api (mismo origen + proxy en vercel.json).
 */
export function getApiBase() {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location
    if (hostname.endsWith('.vercel.app')) {
      return '/api'
    }
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
  return enqueueApi(() => {
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

      const doFetch = async (dbRetry) => {
        const res = await fetch(`${apiBase}${path}`, {
          ...options,
          method,
          headers,
          body: hasBody ? JSON.stringify(options.body) : undefined,
        })

        const data = await res.json().catch(() => ({}))
        if (
          !res.ok &&
          res.status === 503 &&
          data.code === 'DB_CONNECTION_LIMIT' &&
          !dbRetry
        ) {
          await new Promise((r) => setTimeout(r, 2500))
          return doFetch(true)
        }
        if (!res.ok) {
          const err = new Error(data.error || res.statusText || 'Error de API')
          err.status = res.status
          err.data = data
          err.code = data.code
          throw err
        }
        return data
      }

      return doFetch(false)
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
  })
}
