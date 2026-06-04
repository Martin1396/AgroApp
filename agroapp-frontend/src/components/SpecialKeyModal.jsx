import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { CLAVE_ESPECIAL_ADMIN } from '../constants/auth'
import { useSubmitLock } from '../hooks/useSubmitLock'
import './SpecialKeyModal.css'

export default function SpecialKeyModal({ title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    if (codigo.trim() !== CLAVE_ESPECIAL_ADMIN) {
      setError('Clave especial incorrecta')
      return
    }
    await runSubmit(async () => {
      await onConfirm?.()
    })
  }

  return (
    <div className="special-key-overlay" role="dialog" aria-modal="true">
      <div className="special-key-modal">
        <button
          type="button"
          className="special-key-modal__close"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
        <h2 className="special-key-modal__title">{title}</h2>
        {message && <p className="special-key-modal__text">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="special-key-input" className="special-key-modal__label">
            Clave especial
          </label>
          <div className={`special-key-modal__input ${error ? 'special-key-modal__input--error' : ''}`}>
            <KeyRound size={18} />
            <input
              id="special-key-input"
              type="password"
              placeholder="Ingresa la clave especial"
              autoComplete="off"
              value={codigo}
              disabled={isSubmitting}
              onChange={(e) => {
                setCodigo(e.target.value)
                setError('')
              }}
              autoFocus
            />
          </div>
          {error && <p className="special-key-modal__error">{error}</p>}
          <div className="special-key-modal__actions">
            <button
              type="button"
              className="special-key-modal__btn special-key-modal__btn--ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="special-key-modal__btn special-key-modal__btn--confirm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
