import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Check, Plus, Trash2, User, X } from 'lucide-react'
import { useSubmitLock } from '../hooks/useSubmitLock'
import { loadCompanySettings } from '../utils/company'
import { getActiveProductions } from '../utils/productions'
import {
  computeVentaTotal,
  formatMonto,
  formatMontoDual,
  formatPriceForInput,
  getVariedadPrecioUnitario,
  normalizeVentaVariedades,
  MONEDA,
  normalizeMoneda,
  parsePriceInput,
  sanitizePriceInput,
  TIPO_FLOR,
} from '../utils/sales'
import { getComercializadoras, getVariedadesCatalogo } from '../utils/ventasCatalogos'
import './AddVentaModal.css'
import './VentasCatalogosModal.css'

const LEGACY_CLIENTE_PREFIX = '__legacy_cliente__:'
const LEGACY_PROD_PREFIX = '__legacy_prod__:'
const LEGACY_VAR_PREFIX = '__legacy_var__:'

function todayInputValue() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToDateInput(iso) {
  if (!iso) return todayInputValue()
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return todayInputValue()
  }
}

function dateInputToIso(dateStr) {
  if (!dateStr) return new Date().toISOString()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).toISOString()
}

function FieldError({ error }) {
  if (!error) return null
  return <p className="venta-form__error">{error}</p>
}

function buildFormFromVenta(venta) {
  if (!venta) {
    return {
      clienteId: '',
      tipoFlor: null,
      productionId: '',
      moneda: MONEDA.COP,
      variedades: [],
    }
  }
  return {
    clienteId: '',
    tipoFlor: venta.tipoFlor ?? null,
    productionId: venta.productionId ?? '',
    moneda: normalizeMoneda(venta.moneda),
    variedades: normalizeVentaVariedades(venta),
  }
}

export default function AddVentaModal({
  venta = null,
  onSave,
  onCancel,
  onOpenCatalogos,
  catalogRefreshKey = 0,
}) {
  const isEdit = Boolean(venta)
  const nextNum = isEdit ? venta.sequence : null

  const [productions, setProductions] = useState([])
  const [comercializadoras, setComercializadoras] = useState([])
  const [variedadesCatalogo, setVariedadesCatalogo] = useState([])
  const [tasaUsdCop, setTasaUsdCop] = useState(4000)

  const [clienteId, setClienteId] = useState('')
  const [tipoFlor, setTipoFlor] = useState(venta?.tipoFlor ?? null)
  const [productionId, setProductionId] = useState(venta?.productionId ?? '')
  const [variedadId, setVariedadId] = useState('')
  const [varTallos, setVarTallos] = useState('')
  const [varPrecioUnidad, setVarPrecioUnidad] = useState('')
  const [fecha, setFecha] = useState(() => isoToDateInput(venta?.createdAt))
  const [moneda, setMoneda] = useState(venta?.moneda ?? MONEDA.COP)
  const [variedades, setVariedades] = useState(() =>
    isEdit ? normalizeVentaVariedades(venta) : [],
  )
  const [editingVariedadId, setEditingVariedadId] = useState(null)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const { isSubmitting, runSubmit } = useSubmitLock()
  const variedadFormRef = useRef(null)
  const precioInputRef = useRef(null)

  useEffect(() => {
    if (!venta) return
    const base = buildFormFromVenta(venta)
    setTipoFlor(base.tipoFlor)
    setProductionId(base.productionId)
    setMoneda(base.moneda)
    setVariedades(base.variedades)
    clearVariedadDraft()
    setErrors({})
    setAttempted(false)
  }, [venta?.id])

  const clearVariedadDraft = () => {
    setEditingVariedadId(null)
    setVariedadId('')
    setVarTallos('')
    setVarPrecioUnidad('')
  }

  const resolveVariedadNombre = (selectedId) => {
    if (!selectedId) return ''
    if (selectedId.startsWith(LEGACY_VAR_PREFIX)) {
      return selectedId.slice(LEGACY_VAR_PREFIX.length)
    }
    return variedadesCatalogo.find((v) => v.id === selectedId)?.nombre ?? ''
  }

  useEffect(() => {
    if (!isEdit) return
    getActiveProductions().then((list) => {
      const activeProductions = list.map((p) => ({
        id: p.id,
        label: `Producción ${p.code} — Camas ${p.desdeCama} a ${p.hastaCama}`,
      }))
      let merged = activeProductions
      if (venta?.productionId && !activeProductions.some((p) => p.id === venta.productionId)) {
        merged = [
          { id: venta.productionId, label: venta.productionLabel || 'Producción guardada' },
          ...activeProductions,
        ]
      } else if (!venta?.productionId && venta?.productionLabel) {
        const legacyId = `${LEGACY_PROD_PREFIX}${venta.productionLabel}`
        merged = [{ id: legacyId, label: venta.productionLabel }, ...activeProductions]
      }
      setProductions(merged)
      if (venta?.productionId) {
        setProductionId(venta.productionId)
      } else if (!venta?.productionId && venta?.productionLabel) {
        setProductionId(`${LEGACY_PROD_PREFIX}${venta.productionLabel}`)
      }
    })
  }, [isEdit, venta?.id, venta?.productionId, venta?.productionLabel])

  useEffect(() => {
    Promise.all([getComercializadoras(), getVariedadesCatalogo(), loadCompanySettings()])
      .then(([c, v, company]) => {
        setComercializadoras(c)
        setVariedadesCatalogo(v)
        setTasaUsdCop(Number(company.tasaCambioUsd) || 4000)
      })
      .catch(() => {})
  }, [catalogRefreshKey])

  useEffect(() => {
    if (!isEdit || !venta?.cliente || comercializadoras.length === 0) return
    const match = comercializadoras.find(
      (c) => c.nombre.toLowerCase() === venta.cliente.toLowerCase(),
    )
    if (match) {
      setClienteId(match.id)
    } else {
      setClienteId(`${LEGACY_CLIENTE_PREFIX}${venta.cliente}`)
    }
  }, [isEdit, venta?.cliente, comercializadoras])

  const precioTotal = useMemo(() => computeVentaTotal(variedades), [variedades])
  const totalDual = useMemo(
    () => formatMontoDual(precioTotal, moneda, tasaUsdCop),
    [precioTotal, moneda, tasaUsdCop],
  )

  const clienteNombre = useMemo(() => {
    if (clienteId.startsWith(LEGACY_CLIENTE_PREFIX)) {
      return clienteId.slice(LEGACY_CLIENTE_PREFIX.length)
    }
    const found = comercializadoras.find((c) => c.id === clienteId)
    return found?.nombre ?? ''
  }, [clienteId, comercializadoras])

  const legacyCliente = isEdit && venta?.cliente
    && !comercializadoras.some((c) => c.nombre.toLowerCase() === venta.cliente.toLowerCase())

  const editingVariedad = useMemo(
    () => variedades.find((v) => v.id === editingVariedadId) ?? null,
    [variedades, editingVariedadId],
  )

  const legacyVariedadEnEdicion = Boolean(
    editingVariedad
    && !variedadesCatalogo.some((c) => c.nombre.toLowerCase() === editingVariedad.nombre.toLowerCase()),
  )

  const saveVariedadDraft = () => {
    const nextErrors = {}
    const nombre = resolveVariedadNombre(variedadId)
    if (!variedadId || !nombre.trim()) nextErrors.variedadId = 'Selecciona una variedad'
    if (!varTallos.trim() || Number(varTallos) < 1) {
      nextErrors.varTallos = 'Ingresa el número de tallos'
    }
    const precioUnit = parsePriceInput(varPrecioUnidad)
    if (!varPrecioUnidad.trim() || !Number.isFinite(precioUnit) || precioUnit <= 0) {
      nextErrors.varPrecioUnidad = 'Ingresa el precio por unidad'
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors((e) => ({ ...e, ...nextErrors }))
      return
    }

    const entry = {
      id: editingVariedadId ?? (crypto.randomUUID?.() ?? `var-${Date.now()}-${variedades.length}`),
      nombre: nombre.trim(),
      tallos: Number(varTallos),
      precioPorUnidad: precioUnit,
    }

    if (editingVariedadId) {
      setVariedades((prev) => prev.map((v) => (v.id === editingVariedadId ? entry : v)))
    } else {
      setVariedades((prev) => [...prev, entry])
    }

    clearVariedadDraft()
    setErrors((e) => ({
      ...e,
      variedadId: '',
      varTallos: '',
      varPrecioUnidad: '',
      variedades: '',
    }))
  }

  const resolvePrecioVariedad = (variedad) => {
    const fromState = Number(variedad?.precioPorUnidad ?? variedad?.precio_por_unidad)
    if (Number.isFinite(fromState) && fromState > 0) return fromState
    return getVariedadPrecioUnitario(variedad, venta)
  }

  const loadVariedadParaEditar = (v) => {
    const match = variedadesCatalogo.find(
      (c) => c.nombre.toLowerCase() === v.nombre.toLowerCase(),
    )
    const precio = resolvePrecioVariedad(v)
    setEditingVariedadId(v.id)
    setVariedadId(match?.id ?? `${LEGACY_VAR_PREFIX}${v.nombre}`)
    setVarTallos(String(v.tallos ?? ''))
    setVarPrecioUnidad(formatPriceForInput(precio))
    setErrors((e) => ({ ...e, variedadId: '', varTallos: '', varPrecioUnidad: '', variedades: '' }))
    requestAnimationFrame(() => {
      variedadFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      precioInputRef.current?.focus()
      precioInputRef.current?.select()
    })
  }

  const cancelVariedadEdicion = () => {
    clearVariedadDraft()
    setErrors((e) => ({ ...e, variedadId: '', varTallos: '', varPrecioUnidad: '' }))
  }

  const removeVariedad = (id) => {
    setVariedades((prev) => prev.filter((v) => v.id !== id))
    if (editingVariedadId === id) cancelVariedadEdicion()
  }

  const validate = () => {
    const next = {}
    if (!clienteId) next.cliente = 'Selecciona una comercializadora'
    if (!tipoFlor) next.tipoFlor = 'Selecciona exportación o nacional'
    if (variedades.length === 0) next.variedades = 'Agrega al menos una variedad'
    if (variedades.length > 0 && precioTotal <= 0) {
      next.precioTotal = 'El total debe ser mayor a cero'
    }
    return next
  }

  const resolveProductionPayload = () => {
    if (!isEdit) {
      return { productionId: null, productionLabel: '' }
    }
    const prod = productions.find((p) => p.id === productionId)
    const prodId = productionId.startsWith(LEGACY_PROD_PREFIX) ? null : productionId || null
    const prodLabel = prod?.label ?? venta?.productionLabel ?? ''
    return { productionId: prodId, productionLabel: prodLabel }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setAttempted(true)
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const { productionId: prodId, productionLabel: prodLabel } = resolveProductionPayload()

    await runSubmit(async () => {
      await onSave?.({
        cliente: clienteNombre,
        tipoFlor,
        moneda,
        variedades,
        precioVenta: precioTotal,
        productionId: prodId,
        productionLabel: prodLabel,
        fecha: dateInputToIso(fecha),
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
            <label htmlFor="venta-cliente">Comercializadora</label>
            <div className={`venta-input ${attempted && errors.cliente ? 'venta-input--error' : ''}`}>
              <User size={18} />
              <select
                id="venta-cliente"
                className="venta-select venta-select--inline"
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value)
                  setErrors((err) => ({ ...err, cliente: '' }))
                }}
              >
                <option value="">Seleccionar comercializadora</option>
                {legacyCliente && (
                  <option value={`${LEGACY_CLIENTE_PREFIX}${venta.cliente}`}>
                    {venta.cliente}
                  </option>
                )}
                {comercializadoras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            {onOpenCatalogos && (
              <button type="button" className="venta-form__inline-add" onClick={onOpenCatalogos}>
                + Agregar comercializadora
              </button>
            )}
            <FieldError error={errors.cliente} />
          </div>

          <div className="venta-form__group">
            <label htmlFor="venta-fecha">Fecha de la venta</label>
            <div className="venta-input">
              <Calendar size={18} />
              <input
                id="venta-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
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

            {variedades.length > 0 && (
              <>
                <p className="venta-form__edit-hint">
                  Toca una variedad de la lista para modificar tallos o precio abajo.
                </p>
                <ul className="venta-var-list">
                  {variedades.map((v, i) => {
                    const pu = getVariedadPrecioUnitario(v, venta)
                    const subtotal = pu * (Number(v.tallos) || 0)
                    const subDual = formatMontoDual(subtotal, moneda, tasaUsdCop)
                    const isEditingRow = v.id === editingVariedadId
                    return (
                      <li
                        key={v.id}
                        className={isEditingRow ? 'venta-var-list__item--editing' : ''}
                      >
                        <button
                          type="button"
                          className="venta-var-list__edit"
                          onClick={() => loadVariedadParaEditar(v)}
                          title="Modificar tallos y precio"
                        >
                          {i + 1}. {v.nombre} — <strong>{v.tallos}</strong> tallos ×{' '}
                          {formatMonto(pu, moneda)}/u ={' '}
                          <strong>{subDual.primary}</strong>
                          <span className="venta-form__total-secondary"> ({subDual.secondary})</span>
                        </button>
                        <button type="button" onClick={() => removeVariedad(v.id)} aria-label="Quitar">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            <div ref={variedadFormRef} className="venta-form__var-draft">
              {editingVariedadId && editingVariedad && (
                <p className="venta-form__editing-banner">
                  Modificando: <strong>{editingVariedad.nombre}</strong>
                  {resolvePrecioVariedad(editingVariedad) > 0 && (
                    <>
                      {' '}
                      — precio actual:{' '}
                      <strong>
                        {formatMonto(resolvePrecioVariedad(editingVariedad), moneda)}/u
                      </strong>
                    </>
                  )}
                  . Edita abajo y pulsa «Actualizar variedad».
                </p>
              )}
              <div className="venta-form__row venta-form__row--2">
                <div className="venta-form__group">
                  <label htmlFor="var-nombre">Variedad</label>
                  <select
                    id="var-nombre"
                    className={`venta-select ${errors.variedadId ? 'venta-select--error' : ''}`}
                    value={variedadId}
                    onChange={(e) => {
                      setVariedadId(e.target.value)
                      setErrors((err) => ({ ...err, variedadId: '' }))
                    }}
                  >
                    <option value="">Seleccionar variedad</option>
                    {legacyVariedadEnEdicion && editingVariedad && (
                      <option value={`${LEGACY_VAR_PREFIX}${editingVariedad.nombre}`}>
                        {editingVariedad.nombre}
                      </option>
                    )}
                    {variedadesCatalogo.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nombre}
                      </option>
                    ))}
                  </select>
                  {onOpenCatalogos && (
                    <button type="button" className="venta-form__inline-add" onClick={onOpenCatalogos}>
                      + Agregar variedad al catálogo
                    </button>
                  )}
                  <FieldError error={errors.variedadId} />
                </div>
                <div className="venta-form__group">
                  <label htmlFor="var-tallos">Número de tallos</label>
                  <input
                    id="var-tallos"
                    type="text"
                    inputMode="numeric"
                    className={`venta-field-input ${errors.varTallos ? 'venta-field-input--error' : ''}`}
                    placeholder="Cantidad"
                    value={varTallos}
                    onChange={(e) => {
                      setVarTallos(e.target.value.replace(/\D/g, ''))
                      setErrors((err) => ({ ...err, varTallos: '' }))
                    }}
                  />
                  <FieldError error={errors.varTallos} />
                </div>
              </div>

              <div className="venta-form__group venta-form__group--precio-full">
                <label htmlFor="var-precio">Precio por unidad</label>
                <div className="venta-precio-row">
                  <input
                    ref={precioInputRef}
                    id="var-precio"
                    key={editingVariedadId ?? 'nueva-variedad'}
                    type="text"
                    inputMode="decimal"
                    className={`venta-precio-input ${errors.varPrecioUnidad ? 'venta-precio-input--error' : ''}`}
                    placeholder={moneda === MONEDA.USD ? 'Ej. 0,34' : 'Ej. 1500'}
                    value={varPrecioUnidad}
                    aria-label="Precio por unidad"
                    onChange={(e) => {
                      setVarPrecioUnidad(sanitizePriceInput(e.target.value))
                      setErrors((err) => ({ ...err, varPrecioUnidad: '' }))
                    }}
                  />
                  <span className="venta-precio-moneda__suffix">
                    {moneda === MONEDA.USD ? 'USD' : 'COP'}
                  </span>
                </div>
                <div className="venta-moneda venta-moneda--below" role="radiogroup" aria-label="Moneda">
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
                <FieldError error={errors.varPrecioUnidad} />
              </div>
              <div className="venta-form__var-actions">
                <button type="button" className="venta-form__add-var" onClick={saveVariedadDraft}>
                  {editingVariedadId ? <Check size={16} /> : <Plus size={16} />}
                  {editingVariedadId ? 'Actualizar variedad' : 'Agregar variedad'}
                </button>
                {editingVariedadId && (
                  <button
                    type="button"
                    className="venta-form__cancel-var"
                    onClick={cancelVariedadEdicion}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </div>
            {attempted && errors.variedades && <FieldError error={errors.variedades} />}
          </fieldset>

          <div className="venta-form__total">
            <span className="venta-form__total-label">Precio de venta</span>
            <div className="venta-form__total-dual" aria-live="polite">
              <p className="venta-form__total-value">{totalDual.primary}</p>
              <p className="venta-form__total-secondary">{totalDual.secondary}</p>
            </div>
            <p className="venta-form__total-hint">
              Total en {moneda === MONEDA.USD ? 'USD' : 'COP'} y conversión a{' '}
              {moneda === MONEDA.USD ? 'COP' : 'USD'} (tasa {tasaUsdCop.toLocaleString('es-CO')}).
            </p>
            {attempted && errors.precioTotal && <FieldError error={errors.precioTotal} />}
          </div>

          {isEdit && (
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
          )}

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
