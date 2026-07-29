import { useState } from 'react'
import { FileText, Sparkles } from 'lucide-react'
import { COMBO_TEXTO_EJEMPLO, parseComboText } from '../../utils/comboTextParser'
import SpeechInputButton from './SpeechInputButton'
import { appendSpeechText } from '../../hooks/useSpeechInput'

export default function ComboTextoAsistente({ onApply }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const handleApply = () => {
    setError('')
    const result = parseComboText(texto)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onApply?.(result)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        className="combo-texto-asistente__open"
        onClick={() => setOpen(true)}
      >
        <FileText size={16} />
        Pegar descripción general
      </button>
    )
  }

  return (
    <div className="combo-texto-asistente">
      <div className="combo-texto-asistente__head">
        <Sparkles size={16} />
        <strong>Desde texto</strong>
        <span>Pega tu formato con Programa, Descripción general, Rondas y Productos (Nombre, Tipo, Propósito, Dosis)</span>
      </div>
      <div className="combo-texto-asistente__field">
        <textarea
          className="bitacora-form__textarea combo-texto-asistente__textarea"
          rows={10}
          placeholder={COMBO_TEXTO_EJEMPLO}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <SpeechInputButton
          onTranscript={(spoken) => setTexto((prev) => appendSpeechText(prev, spoken))}
          label="Dictar descripción"
          className="combo-texto-asistente__mic"
        />
      </div>
      {error && <p className="venta-form__error">{error}</p>}
      <div className="combo-texto-asistente__actions">
        <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={() => setOpen(false)}>
          Cerrar
        </button>
        <button type="button" className="venta-form__btn venta-form__btn--save" onClick={handleApply}>
          Aplicar al combo
        </button>
      </div>
    </div>
  )
}
