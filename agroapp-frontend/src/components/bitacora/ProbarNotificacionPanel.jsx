import { useState } from 'react'
import { BellRing } from 'lucide-react'
import { simularNotificacionManana, simularNotificacionNoche } from '../../utils/comboNotificaciones'

export default function ProbarNotificacionPanel({ tareasHoy, tareasManana, comboFallback }) {
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const probar = async (tipo) => {
    setBusy(true)
    setMsg('')
    setError('')
    try {
      const res =
        tipo === 'manana'
          ? await simularNotificacionManana(tareasManana, comboFallback)
          : await simularNotificacionNoche(
              tareasHoy.filter((t) => !t.completado),
              comboFallback,
            )
      if (res.ok) {
        setMsg(
          tipo === 'manana'
            ? 'Simulacro enviado: aviso del día anterior (10:00) con combo, ronda y productos.'
            : 'Simulacro enviado: confirmación del día del riego (20:00).',
        )
      } else {
        setError(res.error || 'No se pudo enviar el simulacro.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bitacora-notif-test">
      <p className="bitacora-notif-test__title">
        <BellRing size={16} />
        Probar alarmas
      </p>
      <p className="bitacora-notif-test__hint">
        El día que elijas activa alarmas. Los combos sin día quedan solo para consulta.
      </p>
      <div className="bitacora-notif-test__actions">
        <button
          type="button"
          className="bitacora-notif-test__btn"
          disabled={busy}
          onClick={() => probar('manana')}
        >
          Simular aviso día anterior (10:00)
        </button>
        <button
          type="button"
          className="bitacora-notif-test__btn bitacora-notif-test__btn--secondary"
          disabled={busy}
          onClick={() => probar('noche')}
        >
          Simular confirmación (20:00)
        </button>
      </div>
      {msg && <p className="bitacora-notif-test__ok">{msg}</p>}
      {error && <p className="bitacora-notif-test__err" role="alert">{error}</p>}
    </div>
  )
}
