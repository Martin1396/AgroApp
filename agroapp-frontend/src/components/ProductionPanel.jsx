import { useCallback, useEffect, useState } from 'react'
import { Hash, Plus, Sprout, X } from 'lucide-react'
import { useSubmitLock } from '../hooks/useSubmitLock'
import { addProduction, findActiveCamasConflict, getActiveProductions } from '../utils/productions'
import ProductionCard from './ProductionCard'
import './ProductionPanel.css'

const EMPTY_FORM = { desdeCama: '', hastaCama: '', cantidadPlantas: '' }

function FieldError({ error }) {
  if (!error) return null
  return <p className="production-form__error">{error}</p>
}

export default function ProductionPanel() {
  const [productions, setProductions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const { isSubmitting, runSubmit } = useSubmitLock()

  const refresh = useCallback(async () => {
    const items = await getActiveProductions()
    setProductions(items)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const openModal = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setAttempted(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setErrors({})
    setAttempted(false)
  }

  const handleNumericChange = (name, value) => {
    const digits = value.replace(/\D/g, '')
    setForm((prev) => ({ ...prev, [name]: digits }))
    if (attempted) {
      // validate() es async; actualizamos errores cuando termine
      validate({ ...form, [name]: digits }).then(setErrors)
    }
  }

  const validate = async (data) => {
    const next = {}
    if (!data.desdeCama.trim()) {
      next.desdeCama = 'Ingresa el número de cama inicial'
    }
    if (!data.hastaCama.trim()) {
      next.hastaCama = 'Ingresa el número de cama final'
    }
    if (
      !next.desdeCama &&
      !next.hastaCama &&
      data.desdeCama &&
      data.hastaCama &&
      Number(data.desdeCama) > Number(data.hastaCama)
    ) {
      next.hastaCama = 'Debe ser mayor o igual que la cama inicial'
    }
    if (data.cantidadPlantas.trim() && Number(data.cantidadPlantas) < 1) {
      next.cantidadPlantas = 'Ingresa una cantidad válida'
    }

    if (
      !next.desdeCama &&
      !next.hastaCama &&
      data.desdeCama.trim() &&
      data.hastaCama.trim() &&
      Number(data.desdeCama) <= Number(data.hastaCama)
    ) {
      const conflicto = await findActiveCamasConflict(data.desdeCama.trim(), data.hastaCama.trim())
      if (conflicto) {
        const msg = `Estas camas se solapan con la producción ${conflicto.code} (camas ${conflicto.desdeCama} a ${conflicto.hastaCama}). Finalízala primero o elige otro rango.`
        next.desdeCama = msg
        next.hastaCama = msg
      }
    }

    return next
  }

  const handleConfirm = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setAttempted(true)
    const validationErrors = await validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    await runSubmit(async () => {
      try {
        await addProduction({
          desdeCama: form.desdeCama.trim(),
          hastaCama: form.hastaCama.trim(),
          cantidadPlantas: form.cantidadPlantas.trim()
            ? Number(form.cantidadPlantas)
            : null,
        })
        await refresh()
        closeModal()
      } catch (err) {
        setErrors({ desdeCama: err.message || 'No se pudo crear la producción' })
      }
    })
  }

  const inputClass = (field) =>
    attempted && errors[field] ? 'production-input production-input--error' : 'production-input'

  return (
    <section className="production-panel">
      <div className="production-panel__toolbar">
        <button type="button" className="production-panel__add-btn" onClick={openModal}>
          <Plus size={20} strokeWidth={2.5} />
          Agregar Producción
        </button>
      </div>

      <div className="production-panel__body">
        {productions.length === 0 ? (
          <p className="production-panel__empty">
            No hay registros de producción. Pulsa el botón de arriba para agregar uno.
          </p>
        ) : (
          <ul className="production-list">
            {productions.map((item) => (
              <ProductionCard key={item.id} item={item} onUpdate={refresh} />
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <div className="production-modal-overlay" role="dialog" aria-modal="true">
          <div className="production-modal">
            <button
              type="button"
              className="production-modal__close"
              onClick={closeModal}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            <h2 className="production-modal__title">Agregar producción</h2>

            <form className="production-form" onSubmit={handleConfirm} noValidate>
              <div className="production-form__group">
                <label htmlFor="desde-cama">Desde la cama</label>
                <div className={inputClass('desdeCama')}>
                  <Hash className="production-input__icon" size={18} />
                  <input
                    id="desde-cama"
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de cama"
                    value={form.desdeCama}
                    onChange={(e) => handleNumericChange('desdeCama', e.target.value)}
                  />
                </div>
                <FieldError error={errors.desdeCama} />
              </div>

              <div className="production-form__group">
                <label htmlFor="hasta-cama">Hasta la cama</label>
                <div className={inputClass('hastaCama')}>
                  <Hash className="production-input__icon" size={18} />
                  <input
                    id="hasta-cama"
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de cama"
                    value={form.hastaCama}
                    onChange={(e) => handleNumericChange('hastaCama', e.target.value)}
                  />
                </div>
                <FieldError error={errors.hastaCama} />
              </div>

              <div className="production-form__group">
                <label htmlFor="cantidad-plantas">Cantidad de plantas (opcional)</label>
                <div className={inputClass('cantidadPlantas')}>
                  <Sprout className="production-input__icon" size={18} />
                  <input
                    id="cantidad-plantas"
                    type="text"
                    inputMode="numeric"
                    placeholder="Total de plantas"
                    value={form.cantidadPlantas}
                    onChange={(e) => handleNumericChange('cantidadPlantas', e.target.value)}
                  />
                </div>
                <FieldError error={errors.cantidadPlantas} />
              </div>

              <button type="submit" className="production-form__confirm" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
