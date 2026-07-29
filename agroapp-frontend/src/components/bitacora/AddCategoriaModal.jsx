import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { createComboCategoria } from '../../utils/bitacoraCombos'
import '../AddVentaModal.css'
import './BitacoraFormModal.css'

export default function AddCategoriaModal({ onSaved, onCancel }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')
    if (!nombre.trim()) {
      setError('Ingresa el nombre de la categoría')
      return
    }
    await runSubmit(async () => {
      const item = await createComboCategoria(nombre.trim())
      await onSaved?.(item)
    })
  }

  return (
    <div className="venta-modal-overlay" role="dialog" aria-modal="true">
      <div className="venta-modal">
        <button type="button" className="venta-modal__close" onClick={onCancel} disabled={isSubmitting} aria-label="Cerrar">
          <X size={22} />
        </button>
        <h2 className="venta-modal__title">Nueva categoría</h2>
        <p className="venta-modal__subtitle">
          Ej. Ceniza, Árboles, Invernadero B… Aparecerá como una columna nueva junto a Follaje y Flor.
        </p>
        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <label htmlFor="cat-nombre">Nombre</label>
            <input
              id="cat-nombre"
              type="text"
              className="venta-input venta-input--plain"
              placeholder="Nombre de la categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
            />
          </div>
          {error && <p className="venta-form__error">{error}</p>}
          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
