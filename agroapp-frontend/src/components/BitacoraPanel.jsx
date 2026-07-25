import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ClipboardPen,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import {
  addBitacoraRegistro,
  deleteBitacoraRegistro,
  formatCamasDisplay,
  formatFechaBitacora,
  getBitacoraRegistros,
  getTipoLaborLabel,
  parseCamasUbicacion,
  TIPO_LABOR_LABELS,
  TIPO_LABOR_ORDER,
  updateBitacoraRegistro,
} from '../utils/bitacora'
import BitacoraFormModal from './bitacora/BitacoraFormModal'
import SpecialKeyModal from './SpecialKeyModal'
import './BitacoraPanel.css'

const FILTER_ALL = 'todos'

export default function BitacoraPanel() {
  const [registros, setRegistros] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState(FILTER_ALL)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const refresh = useCallback(async () => {
    setLoadError('')
    setLoading(true)
    try {
      const items = await getBitacoraRegistros()
      setRegistros(items)
    } catch (e) {
      setLoadError(e.message || 'No se pudo cargar la bitácora')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    if (filterTipo === FILTER_ALL) return registros
    return registros.filter((r) => r.tipoLabor === filterTipo)
  }, [registros, filterTipo])

  const handleSave = async (payload) => {
    if (editing) {
      await updateBitacoraRegistro(editing.id, payload)
    } else {
      await addBitacoraRegistro(payload)
    }
    setModalOpen(false)
    setEditing(null)
    await refresh()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteBitacoraRegistro(deleteTarget.id)
    setDeleteTarget(null)
    await refresh()
  }

  return (
    <section className="bitacora-panel">
      <div className="bitacora-panel__head">
        <div className="bitacora-panel__title-wrap">
          <ClipboardPen size={22} />
          <div>
            <h2 className="bitacora-panel__title">Bitácora de labores</h2>
            <p className="bitacora-panel__subtitle">
              Registro de labores por camas y producciones activas
            </p>
          </div>
        </div>
        <button
          type="button"
          className="bitacora-panel__add-btn"
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nueva labor
        </button>
      </div>

      <div className="bitacora-panel__filters">
        <button
          type="button"
          className={`bitacora-filter ${filterTipo === FILTER_ALL ? 'bitacora-filter--active' : ''}`}
          onClick={() => setFilterTipo(FILTER_ALL)}
        >
          Todas
        </button>
        {TIPO_LABOR_ORDER.map((tipo) => (
          <button
            key={tipo}
            type="button"
            className={`bitacora-filter ${filterTipo === tipo ? 'bitacora-filter--active' : ''}`}
            onClick={() => setFilterTipo(tipo)}
          >
            {TIPO_LABOR_LABELS[tipo]}
          </button>
        ))}
      </div>

      <div className="bitacora-panel__body">
        {loading ? (
          <p className="bitacora-panel__empty">Cargando…</p>
        ) : loadError ? (
          <p className="bitacora-panel__empty" role="alert">
            {loadError}
          </p>
        ) : filtered.length === 0 ? (
          <p className="bitacora-panel__empty">
            {registros.length === 0
              ? 'Aún no hay labores registradas. Pulsa «Nueva labor» para crear la primera entrada.'
              : 'No hay registros con ese filtro.'}
          </p>
        ) : (
          <ul className="bitacora-list">
            {filtered.map((item) => (
              <li key={item.id} className="bitacora-card">
                <div className="bitacora-card__top">
                  <div>
                    <span className="bitacora-card__code">Registro {item.code}</span>
                    <span className="bitacora-card__badge">{getTipoLaborLabel(item.tipoLabor)}</span>
                  </div>
                  <div className="bitacora-card__actions">
                    <button
                      type="button"
                      className="bitacora-card__action"
                      onClick={() => {
                        setEditing(item)
                        setModalOpen(true)
                      }}
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="bitacora-card__action bitacora-card__action--danger"
                      onClick={() => setDeleteTarget(item)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bitacora-card__meta">
                  <p>
                    <Calendar size={15} />
                    <strong>{formatFechaBitacora(item.fecha)}</strong>
                  </p>
                  {(() => {
                    const camas = parseCamasUbicacion(item.ubicacion)
                    const legacy = formatCamasDisplay(item.ubicacion)
                    if (!camas.length && !legacy) return null
                    return (
                      <div className="bitacora-card__camas">
                        <MapPin size={15} />
                        <ul className="bitacora-card__camas-list">
                          {camas.length
                            ? camas.map((p) => (
                                <li key={p.id}>
                                  Producción {p.code} — camas {p.desdeCama} a {p.hastaCama}
                                </li>
                              ))
                            : <li>{legacy}</li>}
                        </ul>
                      </div>
                    )
                  })()}
                </div>

                {item.observaciones ? (
                  <div className="bitacora-card__section">
                    <p className="bitacora-card__section-label">Productos y observaciones</p>
                    <p className="bitacora-card__text bitacora-card__text--pre">{item.observaciones}</p>
                  </div>
                ) : null}

                {!item.observaciones && item.proposito ? (
                  <div className="bitacora-card__section">
                    <p className="bitacora-card__section-label">Notas</p>
                    <p className="bitacora-card__text">{item.proposito}</p>
                  </div>
                ) : null}

                {item.registradoPor?.nombre ? (
                  <p className="bitacora-card__footer">
                    <User size={14} />
                    Registrado por {item.registradoPor.nombre}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <BitacoraFormModal
          initial={editing}
          onSave={handleSave}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}

      {deleteTarget && (
        <SpecialKeyModal
          title="Eliminar registro"
          message={`Ingresa la clave especial para eliminar el registro ${deleteTarget.code} del ${formatFechaBitacora(deleteTarget.fecha)}.`}
          confirmLabel="Eliminar"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  )
}
