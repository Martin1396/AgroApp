import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, User, X } from 'lucide-react'
import { useSubmitLock } from '../hooks/useSubmitLock'
import { getActiveProductions } from '../utils/productions'
import {
  computeVentaTotal,
  formatMonto,
  MONEDA,
  TIPO_FLOR,
} from '../utils/sales'
import './AddVentaModal.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="venta-form__error">{error}</p>
}

function sanitizeDecimal(value) {
  return value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
}

export default function AddVentaModal({ venta = null, onSave, onCancel }) {
  const isEdit = Boolean(venta)
  const nextNum = isEdit ? venta.sequence : null

  const [productions, setProductions] = useState([])

  useEffect(() => {
    getActiveProductions().then((list) => {
      const activeProductions = list.map((p) => ({
        id: p.id,
        label: `Producción ${p.code} — Camas ${p.desdeCama} a ${p.hastaCama}`,
      }))
      const merged =
        isEdit &&
        venta.productionId &&
        !activeProductions.some((p) => p.id === venta.productionId)
          ? [{ id: venta.productionId, label: venta.productionLabel }, ...activeProductions]
          : activeProductions
      setProductions(merged)
    })
  }, [isEdit, venta])

  const [cliente, setCliente] = useState(venta?.cliente ?? '')
  const [tipoFlor, setTipoFlor] = useState(venta?.tipoFlor ?? null)
  const [productionId, setProductionId] = useState(venta?.productionId ?? '')
  const [varNombre, setVarNombre] = useState('')
  const [varTallos, setVarTallos] = useState('')
  const [varPrecioUnidad, setVarPrecioUnidad] = useState('')
  const [moneda, setMoneda] = useState(venta?.moneda ?? MONEDA.COP)
  const [variedades, setVariedades] = useState(() =>
    isEdit ? venta.variedades.map((v) => ({ ...v })) : [],
  )
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const { isSubmitting, runSubmit } = useSubmitLock()

  const precioTotal = useMemo(() => computeVentaTotal(variedades), [variedades])

  const addVariedad = () => {
    const nextErrors = {}
    if (!varNombre.trim()) nextErrors.varNombre = 'Ingresa el nombre de la variedad'
    if (!varTallos.trim() || Number(varTallos) < 1) {
      nextErrors.varTallos = 'Ingresa el número de tallos'
    }
    if (!varPrecioUnidad.trim() || Number(varPrecioUnidad) <= 0) {
      nextErrors.varPrecioUnidad = 'Ingresa el precio por unidad'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors((e) => ({ ...e, ...nextErrors }))
      return
    }

    setVariedades((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? `var-${Date.now()}-${prev.length}`,
        nombre: varNombre.trim(),
        tallos: Number(varTallos),
        precioPorUnidad: Number(varPrecioUnidad),
      },
    ])
    setVarNombre('')
    setVarTallos('')
    setVarPrecioUnidad('')
    setErrors((e) => ({
      ...e,
      varNombre: '',
      varTallos: '',
      varPrecioUnidad: '',
      variedades: '',
    }))
  }

  const removeVariedad = (id) => {
    setVariedades((prev) => prev.filter((v) => v.id !== id))
  }

  const validate = () => {
    const next = {}
    if (!cliente.trim()) next.cliente = 'Ingresa el nombre del cliente'
    if (!tipoFlor) next.tipoFlor = 'Selecciona exportación o nacional'
    if (variedades.length === 0) next.variedades = 'Agrega al menos una variedad'
    if (variedades.length > 0 && precioTotal <= 0) {
      next.precioTotal = 'El total debe ser mayor a cero'
    }
    if (!productionId) next.productionId = 'Selecciona la producción asociada'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setAttempted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const prod = productions.find((p) => p.id === productionId)
    await runSubmit(async () => {
      await onSave?.({
        cliente: cliente.trim(),
        tipoFlor,
        moneda,
        variedades,
        precioVenta: precioTotal,
        productionId,
        productionLabel: prod?.label ?? '',
      })
    })
  }

  return (
    <div className="venta-modal-overlay" role="dialog" aria-modal="true">
      <div className="venta-modal">
        <button type="button" className="venta-modal__close" onClick={onCancel} disabled={isSubmitting} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">{isEdit ? 'Modificar venta' : 'Agregar venta'}</h2>
        <p className="venta-modal__subtitle">
          {nextNum != null ? `Venta ${nextNum}` : 'Nueva venta'}
        </p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="venta-form__group">
            <label htmlFor="venta-cliente">Cliente</label>
            <div className={`venta-input ${attempted && errors.cliente ? 'venta-input--error' : ''}`}>
              <User size={18} />
              <input
                id="venta-cliente"
                type="text"
                placeholder="Nombre del cliente"
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value)
                  setErrors((err) => ({ ...err, cliente: '' }))
                }}
              />
            </div>
            <FieldError error={errors.cliente} />
          </div>

          <div className="venta-form__group">
            <span className="venta-form__tipo-label">Tipo de flor</span>
            <div
              className={`venta-tipo-flor ${attempted && errors.tipoFlor ? 'venta-tipo-flor--error' : ''}`}
              role="radiogroup"
              aria-label="Tipo de flor"
            >
              <button
                type="button"
                role="radio"
                aria-checked={tipoFlor === TIPO_FLOR.EXPORTACION}
                className={`venta-tipo-flor__opt ${tipoFlor === TIPO_FLOR.EXPORTACION ? 'venta-tipo-flor__opt--active' : ''}`}
                onClick={() => {
                  setTipoFlor(TIPO_FLOR.EXPORTACION)
                  setErrors((err) => ({ ...err, tipoFlor: '' }))
                }}
              >
                Exportación
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={tipoFlor === TIPO_FLOR.NACIONAL}
                className={`venta-tipo-flor__opt ${tipoFlor === TIPO_FLOR.NACIONAL ? 'venta-tipo-flor__opt--active' : ''}`}
                onClick={() => {
                  setTipoFlor(TIPO_FLOR.NACIONAL)
                  setErrors((err) => ({ ...err, tipoFlor: '' }))
                }}
              >
                Nacional
              </button>
            </div>
            <FieldError error={errors.tipoFlor} />
          </div>

          <fieldset className="venta-form__fieldset">
            <legend>Variedades y tallos</legend>
            <div className="venta-form__row venta-form__row--3">
              <div className="venta-form__group">
                <label htmlFor="var-nombre">Variedad</label>
                <input
                  id="var-nombre"
                  type="text"
                  className={`venta-input venta-input--plain ${errors.varNombre ? 'venta-input--error' : ''}`}
                  placeholder="Nombre de la variedad"
                  value={varNombre}
                  onChange={(e) => {
                    setVarNombre(e.target.value)
                    setErrors((err) => ({ ...err, varNombre: '' }))
                  }}
                />
                <FieldError error={errors.varNombre} />
              </div>
              <div className="venta-form__group">
                <label htmlFor="var-tallos">Número de tallos</label>
                <input
                  id="var-tallos"
                  type="text"
                  inputMode="numeric"
                  className={`venta-input venta-input--plain ${errors.varTallos ? 'venta-input--error' : ''}`}
                  placeholder="Cantidad"
                  value={varTallos}
                  onChange={(e) => {
                    setVarTallos(e.target.value.replace(/\D/g, ''))
                    setErrors((err) => ({ ...err, varTallos: '' }))
                  }}
                />
                <FieldError error={errors.varTallos} />
              </div>
              <div className="venta-form__group venta-form__group--precio">
                <label htmlFor="var-precio">Precio por unidad</label>
                <div className="venta-precio-moneda">
                  <input
                    id="var-precio"
                    type="text"
                    inputMode="decimal"
                    className={`venta-input venta-input--plain ${errors.varPrecioUnidad ? 'venta-input--error' : ''}`}
                    placeholder="Precio por tallo"
                    value={varPrecioUnidad}
                    onChange={(e) => {
                      setVarPrecioUnidad(sanitizeDecimal(e.target.value))
                      setErrors((err) => ({ ...err, varPrecioUnidad: '' }))
                    }}
                  />
                  <div className="venta-moneda" role="radiogroup" aria-label="Moneda">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={moneda === MONEDA.COP}
                      className={`venta-moneda__opt ${moneda === MONEDA.COP ? 'venta-moneda__opt--active' : ''}`}
                      onClick={() => setMoneda(MONEDA.COP)}
                    >
                      COP
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={moneda === MONEDA.USD}
                      className={`venta-moneda__opt ${moneda === MONEDA.USD ? 'venta-moneda__opt--active' : ''}`}
                      onClick={() => setMoneda(MONEDA.USD)}
                    >
                      USD
                    </button>
                  </div>
                </div>
                <FieldError error={errors.varPrecioUnidad} />
              </div>
            </div>
            <button type="button" className="venta-form__add-var" onClick={addVariedad}>
              <Plus size={16} />
              Agregar variedad
            </button>
            {attempted && errors.variedades && (
              <FieldError error={errors.variedades} />
            )}
            {variedades.length > 0 && (
              <ul className="venta-var-list">
                {variedades.map((v, i) => {
                  const subtotal = v.precioPorUnidad * v.tallos
                  return (
                    <li key={v.id}>
                      <span>
                        {i + 1}. {v.nombre} — <strong>{v.tallos}</strong> tallos ×{' '}
                        {formatMonto(v.precioPorUnidad, moneda)}/u ={' '}
                        <strong>{formatMonto(subtotal, moneda)}</strong>
                      </span>
                      <button type="button" onClick={() => removeVariedad(v.id)} aria-label="Quitar">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </fieldset>

          <div className="venta-form__total">
            <span className="venta-form__total-label">Precio de venta</span>
            <p className="venta-form__total-value" aria-live="polite">
              {formatMonto(precioTotal, moneda)}
            </p>
            <p className="venta-form__total-hint">
              Total calculado automáticamente según tallos y precio por unidad de cada variedad.
            </p>
            {attempted && errors.precioTotal && <FieldError error={errors.precioTotal} />}
          </div>

          <div className="venta-form__group">
            <label htmlFor="venta-produccion">Producción asociada</label>
            <select
              id="venta-produccion"
              className={`venta-select ${attempted && errors.productionId ? 'venta-select--error' : ''}`}
              value={productionId}
              onChange={(e) => {
                setProductionId(e.target.value)
                setErrors((err) => ({ ...err, productionId: '' }))
              }}
            >
              <option value="">Seleccionar producción</option>
              {productions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <FieldError error={errors.productionId} />
          </div>

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
