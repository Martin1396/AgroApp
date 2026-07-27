import { useState } from 'react'
import { X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { CATEGORIA_LABELS, CATEGORIA_ORDER, getCategoriaLabel } from '../../utils/inventory'
import '../AddVentaModal.css'
import './InventarioForms.css'

export default function EditProductoCategoriaModal({ producto, onSave, onCancel }) {
  const [categoria, setCategoria] = useState(producto.categoria)
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    if (categoria === producto.categoria) {
      onCancel?.()
      return
    }

    await runSubmit(async () => {
      try {
        await onSave?.(categoria)
      } catch (err) {
        setError(err.message || 'No se pudo cambiar la categoría')
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

        <h2 className="venta-modal__title">Modificar categoría</h2>
        <p className="venta-modal__subtitle">
          {producto.nombre}
          <br />
          Categoría actual: <strong>{getCategoriaLabel(producto.categoria)}</strong>
        </p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <span className="venta-form__tipo-label">Nueva categoría</span>
            <div className="inventario-categoria-pick inventario-categoria-pick--7" role="radiogroup" aria-label="Categoría">
              {CATEGORIA_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="radio"
                  aria-checked={categoria === cat}
                  className={`inventario-categoria-pick__opt ${categoria === cat ? 'inventario-categoria-pick__opt--active' : ''}`}
                  onClick={() => setCategoria(cat)}
                >
                  {CATEGORIA_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="venta-form__error">{error}</p>}

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
