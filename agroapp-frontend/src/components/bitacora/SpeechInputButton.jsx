import { Mic, MicOff } from 'lucide-react'
import { useSpeechInput } from '../../hooks/useSpeechInput'

export default function SpeechInputButton({
  onTranscript,
  label = 'Dictar',
  className = '',
  disabled = false,
}) {
  const { listening, supported, error, toggle } = useSpeechInput({
    onResult: onTranscript,
  })

  if (!supported) return null

  return (
    <span className={`speech-input-btn-wrap ${className}`}>
      <button
        type="button"
        className={`speech-input-btn ${listening ? 'speech-input-btn--active' : ''}`}
        onClick={toggle}
        disabled={disabled}
        title={listening ? 'Detener dictado' : label}
        aria-label={listening ? 'Detener dictado' : label}
      >
        {listening ? <MicOff size={15} /> : <Mic size={15} />}
      </button>
      {error && <span className="speech-input-btn__error">{error}</span>}
    </span>
  )
}
