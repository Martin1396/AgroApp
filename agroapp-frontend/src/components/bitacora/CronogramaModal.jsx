import { useState } from 'react'
import { Bell, CheckCircle2, X } from 'lucide-react'
import { useSubmitLock } from '../../hooks/useSubmitLock'
import { solicitarPermisoAlarmas } from '../../hooks/useComboAlarmas'
import { simularNotificacionManana, tareaDemoNotificacion } from '../../utils/comboNotificaciones'
import { DIAS_SEMANA, getDiaSemanaAnteriorLabel, getDiaSemanaLabel } from '../../utils/bitacoraCombos'
import '../AddVentaModal.css'
import './BitacoraFormModal.css'

export default function CronogramaModal({ combo, onSave, onCancel }) {
  const initial = combo.cronograma?.activo ? combo.cronograma?.diasSemana?.[0] ?? null : null
  const [selected, setSelected] = useState(initial)
  const [error, setError] = useState('')
  const [simMsg, setSimMsg] = useState('')
  const { isSubmitting, runSubmit } = useSubmitLock()
  const numRondas = combo.rondas?.length ?? 1
  const tieneDia = selected != null
  const diaLabel = getDiaSemanaLabel(selected)
  const diaAnteriorLabel = getDiaSemanaAnteriorLabel(selected)

  const select = (value) => {
    if (isSubmitting) return
    setSelected((prev) => {
      const next = prev === value ? null : value
      if (next != null) solicitarPermisoAlarmas()
      return next
    })
    setError('')
    setSimMsg('')
  }

  const probarAlarma = async () => {
    if (!tieneDia) return
    setSimMsg('')
    const demo = tareaDemoNotificacion(combo)
    const res = await simularNotificacionManana([demo], combo)
    setSimMsg(res.ok ? 'Simulacro enviado.' : res.error || 'Error al simular.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    await runSubmit(async () => {
      try {
        await onSave?.(selected == null ? [] : [selected])
      } catch (err) {
        setError(err.message || 'No se pudo guardar. Intenta de nuevo.')
        throw err
      }
    })
  }

  return (
    <div className="venta-modal-overlay" role="dialog" aria-modal="true">
      <div className="venta-modal">
        <button type="button" className="venta-modal__close" onClick={onCancel} disabled={isSubmitting} aria-label="Cerrar">
          <X size={22} />
        </button>

        <h2 className="venta-modal__title">
          <Bell size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Programar riego
        </h2>
        <p className="venta-modal__subtitle">
          Combo: <strong>{combo.nombre}</strong>
          <br />
          {tieneDia ? (
            <span className="bitacora-cronograma-toggle-hint">
              Toca otra vez <strong>{diaLabel}</strong> para quitarlo. Luego pulsa <strong>Guardar cambios</strong>.
            </span>
          ) : initial != null && selected == null ? (
            <span className="bitacora-cronograma-toggle-hint">
              Sin día seleccionado. Pulsa <strong>Guardar cambios</strong> para dejar solo consulta (sin alarmas).
            </span>
          ) : (
            'Elige el día del riego. Sin día queda solo para consulta.'
          )}
        </p>

        <form className="venta-form" onSubmit={handleSubmit} noValidate>
          <div className="bitacora-cronograma-dias">
            {DIAS_SEMANA.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`bitacora-cronograma-dia ${selected === value ? 'bitacora-cronograma-dia--active' : ''}`}
                onClick={() => select(value)}
                disabled={isSubmitting}
              >
                {label}
              </button>
            ))}
          </div>

          {tieneDia && !isSubmitting && (
            <div className="bitacora-cronograma-resumen">
              <CheckCircle2 size={18} />
              <div>
                <p className="bitacora-cronograma-resumen__titulo">
                  Riego: <strong>{diaLabel}</strong>
                  {numRondas > 1 && ` · rota ${numRondas} rondas`}
                </p>
                <p className="bitacora-cronograma-resumen__hint">
                  {diaAnteriorLabel} 10:00 aviso · {diaLabel} 20:00 confirmar riego
                </p>
              </div>
            </div>
          )}

          {isSubmitting && (
            <p className="bitacora-cronograma-guardando">Guardando cronograma…</p>
          )}

          {error && <p className="venta-form__error">{error}</p>}
          {simMsg && <p className="bitacora-notif-test__ok">{simMsg}</p>}

          {tieneDia && !isSubmitting && (
            <button
              type="button"
              className="bitacora-cronograma-simular-btn"
              onClick={probarAlarma}
            >
              Probar aviso del día anterior
            </button>
          )}

          <div className="venta-form__actions">
            <button type="button" className="venta-form__btn venta-form__btn--ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="venta-form__btn venta-form__btn--save" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : tieneDia ? 'Guardar y activar alarmas' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
