const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

let cached = null

async function fetchLiveUsdCop() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error('No se pudo consultar la tasa del dólar')
  const data = await res.json()
  const rate = Number(data?.rates?.COP)
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Tasa del dólar inválida')
  }
  const updatedAt = data.time_last_update_utc
    ? new Date(data.time_last_update_utc).toISOString()
    : new Date().toISOString()
  return { rate, updatedAt, source: 'live' }
}

export class ExchangeRateService {
  constructor(companyRepo) {
    this.companyRepo = companyRepo
  }

  async getUsdCopRate({ forceRefresh = false } = {}) {
    const now = Date.now()
    if (!forceRefresh && cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.payload
    }

    try {
      const live = await fetchLiveUsdCop()
      const payload = {
        rate: live.rate,
        source: live.source,
        updatedAt: live.updatedAt,
      }
      cached = { fetchedAt: now, payload }
      return payload
    } catch {
      const company = await this.companyRepo.get()
      const fallback = Number(company?.tasaCambioUsd) || 4000
      const payload = {
        rate: fallback,
        source: 'config',
        updatedAt: null,
      }
      cached = { fetchedAt: now, payload }
      return payload
    }
  }
}
