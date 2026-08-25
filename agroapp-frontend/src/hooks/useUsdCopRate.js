import { useCallback, useEffect, useState } from 'react'
import { getUsdCopRate } from '../utils/exchangeRate'

const REFRESH_MS = 15 * 60 * 1000 // cada 15 min mientras Ventas está abierta

/** Tasa USD → COP en vivo (Colombia), siempre activa en Ventas. */
export function useUsdCopRate() {
  const [tasaInfo, setTasaInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async ({ forceRefresh = false } = {}) => {
    if (forceRefresh) setLoading(true)
    try {
      const info = await getUsdCopRate({ forceRefresh })
      setTasaInfo(info)
      setError('')
    } catch (e) {
      setError(e.message || 'No se pudo cargar el dólar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const intervalId = window.setInterval(() => refresh({ forceRefresh: true }), REFRESH_MS)

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh({ forceRefresh: true })
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return {
    tasaInfo,
    tasa: tasaInfo?.rate ?? 4000,
    loading,
    error,
    refresh,
  }
}
