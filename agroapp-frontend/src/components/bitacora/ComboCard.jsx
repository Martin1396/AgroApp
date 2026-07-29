import { useState } from 'react'
import { Bell, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { comboTieneAlarmas, cronogramaEstadoLabel, formatDiasSemana } from '../../utils/bitacoraCombos'
import { formatFechaBitacora } from '../../utils/bitacora'
import { rondaEtiqueta, rondaSubtitulo } from '../../utils/comboDisplay'
import ComboProductoItem from './ComboProductoItem'

export default function ComboCard({ combo, onEdit, onDelete, onCronograma, recienGuardado = false }) {
  const [descOpen, setDescOpen] = useState(false)
  const descripcion = combo.descripcion?.trim()
  const conAlarmas = comboTieneAlarmas(combo)

  return (
    <article
      id={`combo-card-${combo.id}`}
      className={`bitacora-card bitacora-card--combo bitacora-combo-card ${recienGuardado ? 'bitacora-combo-card--guardado' : ''} ${conAlarmas ? 'bitacora-combo-card--con-alarma' : ''}`}
    >
      {recienGuardado && (
        <p className="bitacora-combo-card__guardado-tag" role="status">
          Cronograma guardado
        </p>
      )}
      <div className="bitacora-card__top">
        <div className="bitacora-combo-card__title-wrap">
          {descripcion ? (
            <button
              type="button"
              className="bitacora-combo-card__desc-toggle"
              onClick={() => setDescOpen((v) => !v)}
              aria-expanded={descOpen}
            >
              {descOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          ) : (
            <span className="bitacora-combo-card__desc-spacer" aria-hidden />
          )}
          <h3 className="bitacora-card__combo-name">{combo.nombre}</h3>
        </div>
        <div className="bitacora-card__actions">
          <button type="button" className="bitacora-card__action" onClick={() => onEdit?.(combo)} aria-label="Editar combo">
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="bitacora-card__action bitacora-card__action--danger"
            onClick={() => onDelete?.(combo)}
            aria-label="Eliminar combo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {descripcion && descOpen && (
        <p className="bitacora-combo-card__descripcion">{descripcion}</p>
      )}

      {combo.rondas?.length > 0 ? (
        <div className="bitacora-combo-rondas">
          {combo.rondas.map((ronda, i) => {
            const esActiva = combo.rondaActiva?.indice === i
            const conPrograma = comboTieneAlarmas(combo)
            const subtitulo = rondaSubtitulo(ronda, i)
            return (
              <div
                key={ronda.id}
                className={`bitacora-combo-ronda ${esActiva && conPrograma ? 'bitacora-combo-ronda--activa' : ''}`}
              >
                <div className="bitacora-combo-ronda__header">
                  <h4 className="bitacora-combo-ronda__heading">{rondaEtiqueta(ronda, i)}</h4>
                  {esActiva && conPrograma && combo.rondas.length > 1 && (
                    <span className="bitacora-combo-ronda__activa-tag">Próxima ronda</span>
                  )}
                </div>
                {subtitulo && <p className="bitacora-combo-ronda__subtitle">{subtitulo}</p>}
                {ronda.productos?.length > 0 ? (
                  <ul className="bitacora-combo-productos-list">
                    {ronda.productos.map((p) => (
                      <ComboProductoItem key={p.id} producto={p} />
                    ))}
                  </ul>
                ) : (
                  <p className="bitacora-combo-ronda__empty">Sin productos</p>
                )}
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="bitacora-combo__footer">
        <div className={`bitacora-combo__cronograma-wrap ${conAlarmas ? 'bitacora-combo__cronograma-wrap--activo' : ''}`}>
          <p className={`bitacora-combo__cronograma ${conAlarmas ? '' : 'bitacora-combo__cronograma--consulta'}`}>
            <Bell size={14} />
            {conAlarmas ? formatDiasSemana(combo.cronograma.diasSemana) : cronogramaEstadoLabel(combo)}
          </p>
          {conAlarmas && (
            <span className="bitacora-combo__alarma-badge">Alarmas activas</span>
          )}
          {conAlarmas && combo.rondaActiva?.proximaFecha && combo.rondas?.length > 1 && (
            <p className="bitacora-combo__proxima">
              Próximo riego: {formatFechaBitacora(combo.rondaActiva.proximaFecha)} — {combo.rondaActiva.nombre}
            </p>
          )}
        </div>
        <button type="button" className="bitacora-combo__cronograma-btn" onClick={() => onCronograma?.(combo)}>
          Modificar cronograma
        </button>
      </div>
    </article>
  )
}
