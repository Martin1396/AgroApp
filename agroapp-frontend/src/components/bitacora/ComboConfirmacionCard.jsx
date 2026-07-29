import { CheckCircle2, XCircle } from 'lucide-react'
import { formatFechaBitacora } from '../../utils/bitacora'
import ComboProductoItem from './ComboProductoItem'

export default function ComboConfirmacionCard({ tarea, onConfirmar, onPosponer }) {
  const esAtrasada = tarea.atrasada

  return (
    <li className={`bitacora-card bitacora-card--confirmacion ${esAtrasada ? 'bitacora-card--atrasada' : ''}`}>
      <div className="bitacora-card__top">
        <div>
          <span className="bitacora-card__code">
            {esAtrasada
              ? `Pendiente del ${formatFechaBitacora(tarea.fecha)}`
              : '¿Se realizó el riego de hoy?'}
          </span>
          <h3 className="bitacora-card__combo-name">{tarea.nombre}</h3>
          {tarea.rondaNombre && (
            <span className="bitacora-card__ronda-badge">
              {tarea.rondaNombre}
              {tarea.rondaTotal > 1 && ` (${(tarea.rondaIndice ?? 0) + 1}/${tarea.rondaTotal})`}
            </span>
          )}
          {esAtrasada && (
            <p className="bitacora-confirmacion__pregunta">
              ¿Realizaste este riego? Si aún no, volveremos a preguntar mañana.
            </p>
          )}
        </div>
        <div className="bitacora-confirmacion__actions">
          <button
            type="button"
            className="bitacora-card__complete-btn"
            onClick={() => onConfirmar?.(tarea.comboId, tarea.fecha)}
          >
            <CheckCircle2 size={16} />
            Sí, se hizo
          </button>
          <button
            type="button"
            className="bitacora-confirmacion__no-btn"
            onClick={() => onPosponer?.(tarea)}
          >
            <XCircle size={16} />
            Aún no
          </button>
        </div>
      </div>
      {tarea.productos?.length > 0 && (
        <ul className="bitacora-combo-productos-list">
          {tarea.productos.map((p) => (
            <ComboProductoItem key={p.id} producto={p} />
          ))}
        </ul>
      )}
    </li>
  )
}
