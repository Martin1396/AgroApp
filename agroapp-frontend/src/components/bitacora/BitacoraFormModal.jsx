import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { getActiveProductions } from '../../utils/productions'
import {
  formatProductionCamasLabel,
  parseCamasUbicacion,
  serializeCamasSelection,
  TIPO_LABOR,
  TIPO_LABOR_LABELS,
  TIPO_LABOR_ORDER,
  todayIsoDate,
} from '../../utils/bitacora'
import './BitacoraFormModal.css'

function FieldError({ error }) {
  if (!error) return null
  return <p className="bitacora-form__error">{error}</p>
}

export default function BitacoraFormModal({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial?.id)
  const { isSubmitting, runSubmit } = useSubmitLock()
  const [attempted, setAttempted] = useState(false)
  const [errors, setErrors] = useState({})
  const [activeProductions, setActiveProductions] = useState([])
  const [loadingProductions, setLoadingProductions] = useState(true)
  const [selectedIds, setSelectedIds] = useState(() => {
    const parsed = parseCamasUbicacion(initial?.ubicacion)
    return new Set(parsed.map((p) => p.id))
  })
  const [form, setForm] = useState({
    fecha: initial?.fecha || todayIsoDate(),
    tipoLabor: initial?.tipoLabor || TIPO_LABOR.FUMIGACION,
    observaciones: initial?.observaciones || mergeLegacyNotes(initial),
  })

  function mergeLegacyNotes(record) {
    if (!record) return ''
    const parts = []
    if (record.proposito?.trim()) parts.push(record.proposito.trim())
    if (record.productos?.length) {
      const prods = record.productos
        .map((p) => [p.nombre, p.dosis].filter(Boolean).join(' — '))
        .filter(Boolean)
        .join('\n')
      if (prods) parts.push(prods)
    }
    if (record.observaciones?.trim()) parts.push(record.observaciones.trim())
    return parts.join('\n\n')
  }

  useEffect(() => {
    let alive = true
    setLoadingProductions(true)
    getActiveProductions()
      .then((items) => {
        if (alive) setActiveProductions(Array.isArray(items) ? items : [])
      })
      .catch(() => {
        if (alive) setActiveProductions([])
      })
      .finally(() => {
        if (alive) setLoadingProductions(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const allSelected = useMemo(
    () => activeProductions.length > 0 && selectedIds.size === activeProductions.length,
    [activeProductions, selectedIds],
  )

  useEffect(() => {
    if (attempted) setErrors(validate())
  }, [form, selectedIds, activeProductions, attempted])

  const validate = () => {
    const next = {}
    if (!form.fecha?.trim()) next.fecha = 'La fecha es obligatoria'
    if (!form.tipoLabor?.trim()) next.tipoLabor = 'Selecciona el tipo de labor'
    if (activeProductions.length === 0) {
      next.camas = 'No hay producciones activas. Crea una en Producción primero.'
    } else if (selectedIds.size === 0) {
      next.camas = 'Selecciona al menos una producción (camas)'
    }
    return next
  }

  const toggleProduction = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(activeProductions.map((p) => p.id)))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setAttempted(true)
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const selected = activeProductions.filter((p) => selectedIds.has(p.id))

    runSubmit(async () => {
      await onSave({
        fecha: form.fecha,
        tipoLabor: form.tipoLabor,
        ubicacion: serializeCamasSelection(selected),
        proposito: '',
        observaciones: form.observaciones.trim(),
        productos: [],
      })
    })
  }

  const inputClass = (field) =>
    attempted && errors[field] ? 'bitacora-form__input bitacora-form__input--error' : 'bitacora-form__input'

  return (
    <div className="bitacora-form-overlay" role="dialog" aria-modal="true">
      <div className="bitacora-form-modal">
        <button
          type="button"
          className="bitacora-form-modal__close"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <h2 className="bitacora-form-modal__title">
          {isEdit ? 'Editar registro de bitácora' : 'Nuevo registro de bitácora'}
        </h2>
        <p className="bitacora-form-modal__hint">
          Indica la fecha, el tipo de labor, las camas (producciones activas) y escribe productos u
          observaciones en el cuadro de texto.
        </p>

        <form className="bitacora-form" onSubmit={handleSubmit} noValidate>
          <div className="bitacora-form__grid">
            <div className="bitacora-form__field">
              <label htmlFor="bitacora-fecha">Fecha de la labor</label>
              <input
                id="bitacora-fecha"
                type="date"
                className={inputClass('fecha')}
                value={form.fecha}
                disabled={isSubmitting}
                onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
              />
              <FieldError error={errors.fecha} />
            </div>

            <div className="bitacora-form__field">
              <label htmlFor="bitacora-tipo">Tipo de labor</label>
              <select
                id="bitacora-tipo"
                className={inputClass('tipoLabor')}
                value={form.tipoLabor}
                disabled={isSubmitting}
                onChange={(e) => setForm((p) => ({ ...p, tipoLabor: e.target.value }))}
              >
                {TIPO_LABOR_ORDER.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {TIPO_LABOR_LABELS[tipo]}
                  </option>
                ))}
              </select>
              <FieldError error={errors.tipoLabor} />
            </div>
          </div>

          <div className="bitacora-form__field">
            <div className="bitacora-form__camas-head">
              <label>Camas</label>
              {activeProductions.length > 0 ? (
                <button
                  type="button"
                  className="bitacora-form__select-all"
                  onClick={toggleAll}
                  disabled={isSubmitting}
                >
                  {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                </button>
              ) : null}
            </div>

            {loadingProductions ? (
              <p className="bitacora-form__camas-empty">Cargando producciones activas…</p>
            ) : activeProductions.length === 0 ? (
              <p className="bitacora-form__camas-empty">
                No hay producciones activas. Ve a Producción y crea una para poder registrar camas.
              </p>
            ) : (
              <ul className={`bitacora-form__camas-list ${attempted && errors.camas ? 'bitacora-form__camas-list--error' : ''}`}>
                {activeProductions.map((production) => {
                  const checked = selectedIds.has(production.id)
                  return (
                    <li key={production.id}>
                      <label className={`bitacora-form__cama-option ${checked ? 'bitacora-form__cama-option--checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isSubmitting}
                          onChange={() => toggleProduction(production.id)}
                        />
                        <span className="bitacora-form__cama-label">
                          {formatProductionCamasLabel(production)}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <FieldError error={errors.camas} />
          </div>

          <div className="bitacora-form__field">
            <label htmlFor="bitacora-obs">Productos aplicados y observaciones</label>
            <textarea
              id="bitacora-obs"
              className="bitacora-form__textarea"
              rows={5}
              placeholder={'Ej.\nFungicida A — 200 cc/100 L\nEnraizador C — 150 ml\nControl de secadera en camas seleccionadas'}
              value={form.observaciones}
              disabled={isSubmitting}
              onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
            />
          </div>

          <div className="bitacora-form__actions">
            <button
              type="button"
              className="bitacora-form__btn bitacora-form__btn--ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className="bitacora-form__btn bitacora-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Registrar labor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
