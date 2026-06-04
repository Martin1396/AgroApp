import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  CATEGORIA_LABELS,
  findProductoByCode,
  formatFechaInventario,
  getMovimientosByTipo,
  getProductos,
  registrarIngreso,
  TIPO_MOVIMIENTO,
} from '../../utils/inventory'
import './InventarioMovimientosTab.css'
import './InventarioForms.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="inventario-form__error">{error}</p>
}

export default function InventarioIngresosTab({ onUpdate }) {
  const [codigo, setCodigo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [formError, setFormError] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [tick, setTick] = useState(0)

  const productos = useMemo(() => getProductos(), [tick])
  const movimientos = useMemo(() => getMovimientosByTipo(TIPO_MOVIMIENTO.INGRESO), [tick])
  const producto = useMemo(() => findProductoByCode(codigo), [codigo, tick])

  const refresh = () => {
    setTick((n) => n + 1)
    onUpdate?.()
  }

  const resetForm = () => {
    setCodigo('')
    setCantidad('')
    setFormError('')
    setAttempted(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setAttempted(true)
    setFormError('')

    if (!producto) {
      setFormError('No existe un producto con ese código en el inventario')
      return
    }
    if (!cantidad.trim() || Number(cantidad) < 1) {
      setFormError('Ingresa la cantidad a agregar')
      return
    }

    const result = registrarIngreso({
      productoId: producto.id,
      cantidad: Number(cantidad),
    })

    if (!result.ok) {
      setFormError(result.error)
      return
    }

    resetForm()
    refresh()
  }

  return (
    <div className="inventario-mov">
      <form className="inventario-mov__form" onSubmit={handleSubmit} noValidate>
        <h3 className="inventario-mov__form-title">Ingreso de producto existente</h3>
        <p className="inventario-mov__hint inventario-mov__hint--top">
          Ingresa el código del producto (ej. Q1, A2, H3). El nombre y la categoría se completan solos.
        </p>

        <div className="inventario-mov__fields">
          <div className="inventario-mov__field">
            <label htmlFor="ingreso-codigo">Código del producto</label>
            <input
              id="ingreso-codigo"
              type="text"
              inputMode="text"
              className={`inventario-mov__input ${attempted && !producto ? 'inventario-mov__input--error' : ''}`}
              placeholder="Ej. Q1, A2, H3"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
                setFormError('')
              }}
            />
          </div>

          <div className="inventario-mov__field inventario-mov__field--wide">
            <label htmlFor="ingreso-nombre-auto">Nombre del producto</label>
            <input
              id="ingreso-nombre-auto"
              type="text"
              className="inventario-mov__input inventario-mov__input--readonly"
              readOnly
              placeholder="Se completa con el código"
              value={producto ? producto.nombre : ''}
            />
          </div>

          <div className="inventario-mov__field">
            <label htmlFor="ingreso-categoria-auto">Categoría</label>
            <input
              id="ingreso-categoria-auto"
              type="text"
              className="inventario-mov__input inventario-mov__input--readonly"
              readOnly
              placeholder="Automática"
              value={producto ? CATEGORIA_LABELS[producto.categoria] : ''}
            />
          </div>

          <div className="inventario-mov__field">
            <label htmlFor="ingreso-cantidad">Cantidad a ingresar</label>
            <input
              id="ingreso-cantidad"
              type="text"
              inputMode="numeric"
              className={`inventario-mov__input ${attempted && (!cantidad.trim() || Number(cantidad) < 1) ? 'inventario-mov__input--error' : ''}`}
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value.replace(/\D/g, ''))
                setFormError('')
              }}
            />
          </div>
        </div>

        {producto && (
          <p className="inventario-mov__stock-actual">
            Stock actual: <strong>{producto.stock}</strong> {producto.unidad}
          </p>
        )}

        {formError && <FieldError error={formError} />}

        {productos.length === 0 && (
          <p className="inventario-mov__hint">
            No hay productos en inventario. Agrégalos primero en la pestaña Inventario.
          </p>
        )}

        <button
          type="submit"
          className="inventario-mov__submit inventario-mov__submit--ingreso"
          disabled={productos.length === 0}
        >
          <Plus size={18} />
          Agregar producto
        </button>
      </form>

      <div className="inventario-mov__list-wrap">
        <h3 className="inventario-mov__list-title">Ingresos registrados</h3>
        {movimientos.length === 0 ? (
          <p className="inventario-mov__empty">No hay ingresos registrados aún.</p>
        ) : (
          <ul className="inventario-mov-list">
            {movimientos.map((m) => (
              <li key={m.id} className="inventario-mov-card">
                <div className="inventario-mov-card__top">
                  <strong>
                    {m.productoCode ? `${m.productoCode} — ` : ''}
                    {m.productoNombre}
                  </strong>
                  <span className="inventario-mov-card__qty">
                    +{m.cantidad} {m.unidad}
                  </span>
                </div>
                <p className="inventario-mov-card__stock">
                  Stock resultante: <strong>{m.stockResultante}</strong> {m.unidad}
                </p>
                {m.nota && <p className="inventario-mov-card__nota">{m.nota}</p>}
                <p className="inventario-mov-card__meta">
                  {formatFechaInventario(m.fecha)} — {m.usuario?.nombre ?? 'Usuario'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
