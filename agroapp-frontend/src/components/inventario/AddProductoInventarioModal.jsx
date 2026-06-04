import { useState } from 'react'
import { X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { CATEGORIA, CATEGORIA_LABELS } from '../../utils/inventory'
import '../AddVentaModal.css'
import './InventarioForms.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="venta-form__error">{error}</p>
}

export default function AddProductoInventarioModal({ onSave, onCancel }) {
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIA.QUIMICO)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const { isSubmitting, runSubmit } = useSubmitLock()

  const validate = () => {
    const next = {}
    if (!nombre.trim()) next.nombre = 'Ingresa el nombre del producto'
    if (!cantidad.trim() || Number(cantidad) < 1) {
      next.cantidad = 'Ingresa la cantidad'
    }
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setAttempted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    await runSubmit(async () => {
      await onSave?.({
        nombre: nombre.trim(),
        cantidad: Number(cantidad),
        descripcion: descripcion.trim(),
        categoria,
      })
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

        <h2 className="venta-modal__title">Agregar producto</h2>
        <p className="venta-modal__subtitle">Nuevo ítem de inventario</p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <label htmlFor="inv-prod-nombre">Nombre del producto</label>
            <input
              id="inv-prod-nombre"
              type="text"
              className={`venta-input venta-input--plain ${attempted && errors.nombre ? 'venta-input--error' : ''}`}
              placeholder="Ej. Pala, Abono NPK, Herbicida"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setErrors((err) => ({ ...err, nombre: '' }))
              }}
            />
            <FieldError error={errors.nombre} />
          </div>

          <div className="venta-form__group">
            <label htmlFor="inv-prod-cant">Cantidad</label>
            <input
              id="inv-prod-cant"
              type="text"
              inputMode="numeric"
              className={`venta-input venta-input--plain ${attempted && errors.cantidad ? 'venta-input--error' : ''}`}
              placeholder="Cantidad en inventario"
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value.replace(/\D/g, ''))
                setErrors((err) => ({ ...err, cantidad: '' }))
              }}
            />
            <FieldError error={errors.cantidad} />
          </div>

          <div className="venta-form__group">
            <label htmlFor="inv-prod-desc">Descripción</label>
            <textarea
              id="inv-prod-desc"
              className="inventario-textarea"
              placeholder="Descripción breve del producto"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="venta-form__group">
            <span className="venta-form__tipo-label">Categoría</span>
            <div className="inventario-categoria-pick" role="radiogroup" aria-label="Categoría">
              {[CATEGORIA.QUIMICO, CATEGORIA.ABONO, CATEGORIA.HERRAMIENTA].map((cat) => (
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

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
