import { useCallback, useEffect, useRef, useState } from 'react'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useSpeechInput({ lang = 'es-CO', onResult, continuous = false } = {}) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()))
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    setError('')
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      setError('Tu navegador no soporta dictado por voz')
      return
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        /* ignore */
      }
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = continuous
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = (e) => {
      setListening(false)
      if (e.error === 'not-allowed') {
        setError('Permite el micrófono en el navegador')
      } else if (e.error !== 'aborted') {
        setError('No se pudo capturar la voz')
      }
    }
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) onResultRef.current?.(transcript)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setError('No se pudo iniciar el micrófono')
      setListening(false)
    }
  }, [continuous, lang])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
  }, [])

  return { listening, supported, error, start, stop, toggle }
}

/** Añade texto dictado al valor actual del campo. */
export function appendSpeechText(current, spoken) {
  const prev = String(current ?? '').trim()
  const next = String(spoken ?? '').trim()
  if (!next) return prev
  if (!prev) return next
  return `${prev} ${next}`
}
