import { useEffect, useRef } from 'react'

/** Intervalo entre actualizaciones automáticas (varios dispositivos a la vez). */
const DEFAULT_INTERVAL_MS = 8000

/**
 * Vuelve a cargar datos en segundo plano mientras el panel está visible.
 * Útil para ver cambios del celular en el PC (y viceversa) sin refrescar la página.
 */
export function useLiveRefresh(refresh, enabled = true, intervalMs = DEFAULT_INTERVAL_MS) {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    if (!enabled) return

    const runSilent = () => {
      if (document.visibilityState !== 'visible') return
      const fn = refreshRef.current
      if (!fn) return
      Promise.resolve(fn({ silent: true })).catch(() => {})
    }

    runSilent()
    const id = setInterval(runSilent, intervalMs)

    const onVisible = () => {
      if (document.visibilityState === 'visible') runSilent()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [enabled, intervalMs])
}
