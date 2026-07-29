import SpeechInputButton from './SpeechInputButton'
import { appendSpeechText } from '../../hooks/useSpeechInput'

export function SpeechFieldLabel({ htmlFor, children, onSpeech, speechLabel }) {
  return (
    <div className="speech-field__label-row">
      <label htmlFor={htmlFor}>{children}</label>
      {onSpeech && <SpeechInputButton onTranscript={onSpeech} label={speechLabel} />}
    </div>
  )
}

export function SpeechInputWrap({ value, onSpeech, children, className = '' }) {
  return (
    <div className={`speech-field ${className}`}>
      {children}
      {onSpeech && (
        <SpeechInputButton
          onTranscript={(text) => onSpeech(appendSpeechText(value, text))}
          className="speech-field__mic"
        />
      )}
    </div>
  )
}
