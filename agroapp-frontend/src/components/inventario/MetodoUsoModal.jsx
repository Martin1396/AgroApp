import { useState } from 'react'
import { X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import '../AddVentaModal.css'
import './InventarioForms.css'

export default function MetodoUsoModal({ producto, onSave, onCancel }) {
  const [texto, setTexto] = useState(producto.metodoUso ?? '')
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    await runSubmit(async () => {
      try {
        await onSave?.(texto.trim())
      } catch (err) {
        setError(err.message || 'No se pudo guardar el método de uso')
      }
    })
  }

  return (
    <div
      className="venta-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div className="venta-modal">
        <button type="button" className="venta-modal__close" onClick={onCancel} disabled={isSubmitting} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">Método de uso</h2>
        <p className="venta-modal__subtitle">
          {producto.nombre}
        </p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <label htmlFor="metodo-uso-texto">¿Cómo lo usas?</label>
            <textarea
              id="metodo-uso-texto"
              className="inventario-textarea inventario-textarea--metodo"
              placeholder="Ej. 2 ml por litro, aplicar al atardecer, usar EPI..."
              rows={6}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <p className="inventario-metodo-hint">Lo que escribas aquí queda guardado para este producto.</p>
          </div>

          {error && <p className="venta-form__error">{error}</p>}

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
