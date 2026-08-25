import { apiRequest } from '../api/client'
import { loadCompanySettings } from './company'

let cachedRate = null
const CACHE_MS = 15 * 60 * 1000

export async function getUsdCopRate({ forceRefresh = false } = {}) {
  const now = Date.now()
  if (!forceRefresh && cachedRate && now - cachedRate.fetchedAt < CACHE_MS) {
    return cachedRate.payload
  }

  try {
    const payload = await apiRequest('/exchange-rate/usd-cop')
    cachedRate = { fetchedAt: now, payload }
    return payload
  } catch {
    try {
      const settings = await loadCompanySettings()
      const fallback = Number(settings?.tasaCambioUsd) || 4000
      const payload = {
        rate: fallback,
        source: 'config',
        updatedAt: null,
      }
      cachedRate = { fetchedAt: now, payload }
      return payload
    } catch {
      const payload = { rate: 4000, source: 'config', updatedAt: null }
      cachedRate = { fetchedAt: now, payload }
      return payload
    }
  }
}
