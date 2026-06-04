import { useCallback, useRef, useState } from 'react'

/** Evita envíos duplicados: solo el primer clic ejecuta hasta que termine la operación async. */
export function useSubmitLock() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lockRef = useRef(false)

  const runSubmit = useCallback(async (fn) => {
    if (lockRef.current) return null
    lockRef.current = true
    setIsSubmitting(true)
    try {
      return await fn()
    } finally {
      lockRef.current = false
      setIsSubmitting(false)
    }
  }, [])

  return { isSubmitting, runSubmit }
}
