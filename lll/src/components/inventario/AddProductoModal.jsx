import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { CATEGORIA, CATEGORIA_LABELS, getNextProductCode } from '../../utils/inventory'
import '../AddVentaModal.css'
import './InventarioForms.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="venta-form__error">{error}</p>
}

export default function AddProductoModal({ onSave, onCancel }) {
  const [categoria, setCategoria] = useState(CATEGORIA.HERRAMIENTA)
  const nextCode = useMemo(() => getNextProductCode(categoria), [categoria])
  const [unidad, setUnidad] = useState('unidad')
  const [stockInicial, setStockInicial] = useState('')
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)

  const validate = () => {
    const next = {}
    if (!nombre.trim()) next.nombre = 'Ingresa el nombre del producto'
    if (!unidad.trim()) next.unidad = 'Ingresa la unidad de medida'
    return next
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttempted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave?.({
      nombre: nombre.trim(),
      categoria,
      unidad: unidad.trim(),
      stockInicial: stockInicial.trim() ? Number(stockInicial) : 0,
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
        <button type="button" className="venta-modal__close" onClick={onCancel} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">Agregar producto</h2>
        <p className="venta-modal__subtitle">Código {nextCode}</p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <label htmlFor="prod-nombre">Nombre del producto</label>
            <input
              id="prod-nombre"
              type="text"
              className={`venta-input venta-input--plain ${attempted && errors.nombre ? 'venta-input--error' : ''}`}
              placeholder="Ej. Fungicida, Pala, Abono NPK"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                setErrors((err) => ({ ...err, nombre: '' }))
              }}
            />
            <FieldError error={errors.nombre} />
          </div>

          <div className="venta-form__group">
            <span className="venta-form__tipo-label">Categoría</span>
            <div className="inventario-categoria-pick" role="radiogroup" aria-label="Categoría">
              {Object.values(CATEGORIA).map((cat) => (
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

          <div className="venta-form__row">
            <div className="venta-form__group">
              <label htmlFor="prod-unidad">Unidad</label>
              <input
                id="prod-unidad"
                type="text"
                className={`venta-input venta-input--plain ${attempted && errors.unidad ? 'venta-input--error' : ''}`}
                placeholder="unidad, kg, litro..."
                value={unidad}
                onChange={(e) => {
                  setUnidad(e.target.value)
                  setErrors((err) => ({ ...err, unidad: '' }))
                }}
              />
              <FieldError error={errors.unidad} />
            </div>
            <div className="venta-form__group">
              <label htmlFor="prod-stock">Stock inicial (opcional)</label>
              <input
                id="prod-stock"
                type="text"
                inputMode="numeric"
                className="venta-input venta-input--plain"
                placeholder="0"
                value={stockInicial}
                onChange={(e) => setStockInicial(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
