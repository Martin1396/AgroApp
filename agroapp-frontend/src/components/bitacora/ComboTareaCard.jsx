import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import ComboProductoItem from './ComboProductoItem'

export default function ComboTareaCard({ tarea, onCompletar, variant = 'hoy' }) {
  const [descOpen, setDescOpen] = useState(false)
  const descripcion = tarea.descripcion?.trim()
  const esManana = variant === 'manana'

  return (
    <li className={`bitacora-card bitacora-card--tarea ${esManana ? 'bitacora-card--manana' : ''} ${tarea.completado ? 'bitacora-card--done' : ''}`}>
      <div className="bitacora-card__top">
        <div>
          <span className="bitacora-card__code">
            {esManana ? 'Programado para mañana' : tarea.completado ? 'Completado' : 'Se debe hacer hoy'}
          </span>
          <div className="bitacora-combo-card__title-wrap">
            {descripcion ? (
              <button
                type="button"
                className="bitacora-combo-card__desc-toggle"
                onClick={() => setDescOpen((v) => !v)}
                aria-expanded={descOpen}
              >
                {descOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : null}
            <h3 className="bitacora-card__combo-name">{tarea.nombre}</h3>
          </div>
          {tarea.rondaNombre && (
            <span className="bitacora-card__ronda-badge">
              {tarea.rondaNombre}
              {tarea.rondaTotal > 1 && ` (${(tarea.rondaIndice ?? 0) + 1}/${tarea.rondaTotal})`}
            </span>
          )}
          {descripcion && descOpen && (
            <p className="bitacora-combo-card__descripcion">{descripcion}</p>
          )}
        </div>
        {!esManana && !tarea.completado && (
          <button type="button" className="bitacora-card__complete-btn" onClick={() => onCompletar?.(tarea.comboId)}>
            <CheckCircle2 size={16} />
            Marcar hecho
          </button>
        )}
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
