import { useState } from 'react'
import { Calendar, Flower2, X } from 'lucide-react'
import './EditCorteModal.css'

function isoToDateInput(iso) {
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return ''
  }
}

function dateInputToIso(dateStr) {
  if (!dateStr) return new Date().toISOString()
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).toISOString()
}

export default function EditCorteModal({ corte, onSave, onCancel }) {
  const [cantidad, setCantidad] = useState(String(corte.cantidad))
  const [fecha, setFecha] = useState(isoToDateInput(corte.fecha))
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const valor = cantidad.replace(/\D/g, '')
    if (!valor || Number(valor) < 1) {
      setError('Ingresa una cantidad válida')
      return
    }
    if (!fecha) {
      setError('Selecciona la fecha del corte')
      return
    }
    onSave?.({
      cantidad: Number(valor),
      fecha: dateInputToIso(fecha),
    })
  }

  return (
    <div className="edit-corte-overlay" role="dialog" aria-modal="true">
      <div className="edit-corte-modal">
        <button type="button" className="edit-corte-modal__close" onClick={onCancel} aria-label="Cerrar">
          <X size={20} />
        </button>

        <h2 className="edit-corte-modal__title">Modificar corte</h2>
        <p className="edit-corte-modal__subtitle">Corte {corte.sequence}</p>

        <form className="edit-corte-form" onSubmit={handleSubmit}>
          <div className="edit-corte-form__group">
            <label htmlFor="edit-corte-cantidad">Cantidad de flores</label>
            <div className={`edit-corte-input ${error && !cantidad ? 'edit-corte-input--error' : ''}`}>
              <Flower2 size={18} />
              <input
                id="edit-corte-cantidad"
                type="text"
                inputMode="numeric"
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value.replace(/\D/g, ''))
                  setError('')
                }}
              />
            </div>
          </div>

          <div className="edit-corte-form__group">
            <label htmlFor="edit-corte-fecha">Fecha del corte</label>
            <div className={`edit-corte-input ${error && !fecha ? 'edit-corte-input--error' : ''}`}>
              <Calendar size={18} />
              <input
                id="edit-corte-fecha"
                type="date"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  setError('')
                }}
              />
            </div>
          </div>

          {error && <p className="edit-corte-form__error">{error}</p>}

          <div className="edit-corte-form__actions">
            <button type="button" className="edit-corte-form__btn edit-corte-form__btn--ghost" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="edit-corte-form__btn edit-corte-form__btn--save">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
