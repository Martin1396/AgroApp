import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ClipboardPen,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react'
import { useComboAlarmas, solicitarPermisoAlarmas, estadoNotificaciones } from '../hooks/useComboAlarmas'
import { useLiveRefresh } from '../hooks/useLiveRefresh'
import {
  addBitacoraRegistro,
  deleteBitacoraRegistro,
  formatCamasDisplay,
  formatFechaBitacora,
  getBitacoraRegistros,
  getTipoLaborLabel,
  parseCamasUbicacion,
  todayIsoDate,
  TIPO_LABOR_LABELS,
  TIPO_LABOR_ORDER,
  updateBitacoraRegistro,
} from '../utils/bitacora'
import {
  createCombo,
  deleteCombo,
  formatDiasSemana,
  getComboCategorias,
  getCombos,
  getTareasHoy,
  getTareasPendientesConfirmacion,
  marcarComboCompletado,
  offsetIsoDate,
  saveCronograma,
  updateCombo,
} from '../utils/bitacoraCombos'
import AddCategoriaModal from './bitacora/AddCategoriaModal'
import BitacoraFormModal from './bitacora/BitacoraFormModal'
import ComboCard from './bitacora/ComboCard'
import ComboConfirmacionCard from './bitacora/ComboConfirmacionCard'
import ComboFormModal from './bitacora/ComboFormModal'
import ComboTareaCard from './bitacora/ComboTareaCard'
import CronogramaModal from './bitacora/CronogramaModal'
import SpecialKeyModal from './SpecialKeyModal'
import './BitacoraPanel.css'

const FILTER_ALL = 'todos'
const TAB_HOY = 'hoy'
const TAB_COMBOS = 'combos'
const TAB_HISTORIAL = 'historial'

export default function BitacoraPanel() {
  const [tab, setTab] = useState(TAB_HOY)
  const [registros, setRegistros] = useState([])
  const [combos, setCombos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [tareasHoy, setTareasHoy] = useState([])
  const [tareasManana, setTareasManana] = useState([])
  const [tareasPendientesConfirmacion, setTareasPendientesConfirmacion] = useState([])
  const [fechaHoy, setFechaHoy] = useState(todayIsoDate())
  const [fechaManana, setFechaManana] = useState(() => offsetIsoDate(todayIsoDate(), 1))
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState(FILTER_ALL)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [comboModalOpen, setComboModalOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState(null)
  const [cronogramaCombo, setCronogramaCombo] = useState(null)
  const [cronogramaOk, setCronogramaOk] = useState(null)
  const [cronogramaError, setCronogramaError] = useState(null)
  const [deleteComboTarget, setDeleteComboTarget] = useState(null)
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false)
  const [newComboCategoriaId, setNewComboCategoriaId] = useState(null)
  const [newComboCategoriaNombre, setNewComboCategoriaNombre] = useState('')
  const combosScrollRef = useRef(null)
  const prevCategoriasCount = useRef(0)
  const tabRef = useRef(tab)
  tabRef.current = tab

  const loadTareas = useCallback(async () => {
    const hoy = todayIsoDate()
    const manana = offsetIsoDate(hoy, 1)
    setFechaHoy(hoy)
    setFechaManana(manana)
    const [tareas, tareasProximo, pendientesConf] = await Promise.all([
      getTareasHoy(hoy),
      getTareasHoy(manana),
      getTareasPendientesConfirmacion(hoy),
    ])
    setTareasHoy(tareas.items ?? [])
    setTareasManana(tareasProximo.items ?? [])
    setTareasPendientesConfirmacion(pendientesConf ?? [])
  }, [])

  const loadCombos = useCallback(async () => {
    const [comboItems, catItems] = await Promise.all([
      getCombos(),
      getComboCategorias(),
    ])
    setCombos(comboItems)
    setCategorias(catItems)
  }, [])

  const loadHistorial = useCallback(async () => {
    const items = await getBitacoraRegistros()
    setRegistros(items)
  }, [])

  const refresh = useCallback(async ({ silent = false, scope = 'all' } = {}) => {
    const showLoading = !silent && scope === 'all'
    if (showLoading) {
      setLoadError('')
      setLoading(true)
    }
    try {
      if (scope === 'all') {
        await Promise.all([loadTareas(), loadCombos(), loadHistorial()])
      } else if (scope === 'combos+tareas') {
        await Promise.all([loadCombos(), loadTareas()])
      } else if (scope === 'combos') {
        await loadCombos()
      } else if (scope === 'tareas') {
        await loadTareas()
      } else if (scope === 'historial') {
        await loadHistorial()
      }
    } catch (e) {
      if (!silent) setLoadError(e.message || 'No se pudo cargar la bitácora')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [loadTareas, loadCombos, loadHistorial])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (categorias.length > prevCategoriasCount.current && combosScrollRef.current) {
      combosScrollRef.current.scrollTo({
        left: combosScrollRef.current.scrollWidth,
        behavior: 'smooth',
      })
    }
    prevCategoriasCount.current = categorias.length
  }, [categorias.length])

  const modalsOpen = modalOpen || deleteTarget || comboModalOpen || cronogramaCombo || deleteComboTarget || categoriaModalOpen

  const liveRefresh = useCallback(() => {
    const activeTab = tabRef.current
    const scope =
      activeTab === TAB_HOY ? 'tareas' : activeTab === TAB_COMBOS ? 'combos' : 'historial'
    return refresh({ silent: true, scope })
  }, [refresh])

  useLiveRefresh(liveRefresh, !modalsOpen, 15000)

  const skipTabRefresh = useRef(true)
  useEffect(() => {
    if (loading) return
    if (skipTabRefresh.current) {
      skipTabRefresh.current = false
      return
    }
    const scope = tab === TAB_HOY ? 'tareas' : tab === TAB_COMBOS ? 'combos' : 'historial'
    refresh({ silent: true, scope })
  }, [tab, loading, refresh])

  const filtered = useMemo(() => {
    if (filterTipo === FILTER_ALL) return registros
    return registros.filter((r) => r.tipoLabor === filterTipo)
  }, [registros, filterTipo])

  const tareasPendientes = tareasHoy.filter((t) => !t.completado)
  const totalPendientes = tareasPendientes.length + tareasPendientesConfirmacion.length
  const riegosHoyTotal = tareasHoy.length
  const riegosHoyHechos = tareasHoy.filter((t) => t.completado).length

  useComboAlarmas({ tareasHoy, tareasManana, fechaHoy })

  const combosPorCategoria = useMemo(() => {
    const map = new Map()
    for (const cat of categorias) map.set(cat.id, [])
    for (const combo of combos) {
      const key = combo.categoriaId && map.has(combo.categoriaId) ? combo.categoriaId : categorias[0]?.id
      if (key) map.get(key).push(combo)
    }
    return map
  }, [combos, categorias])

  const handleSave = async (payload) => {
    if (editing) await updateBitacoraRegistro(editing.id, payload)
    else await addBitacoraRegistro(payload)
    setModalOpen(false)
    setEditing(null)
    await refresh({ silent: true, scope: 'historial' })
  }

  const handleComboSave = async (payload) => {
    if (editingCombo) await updateCombo(editingCombo.id, payload)
    else await createCombo(payload)
    setComboModalOpen(false)
    setEditingCombo(null)
    setNewComboCategoriaId(null)
    setNewComboCategoriaNombre('')
    await refresh({ silent: true, scope: 'combos' })
    setTab(TAB_COMBOS)
  }

  const handleCronogramaSave = async (diasSemana) => {
    const comboId = cronogramaCombo.id
    const nombre = cronogramaCombo.nombre
    const dias = diasSemana ?? []

    setCronogramaCombo(null)
    setCronogramaError(null)
    setTab(TAB_COMBOS)

    try {
      await saveCronograma(comboId, dias)
      if (dias.length) solicitarPermisoAlarmas()
      setCronogramaOk({
        comboId,
        nombre,
        diasSemana: dias,
        notif: dias.length ? estadoNotificaciones() : null,
        sinAlarmas: !dias.length,
      })
      await refresh({ silent: true, scope: 'combos+tareas' })
      window.setTimeout(() => {
        document.getElementById(`combo-card-${comboId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }, 150)
      window.setTimeout(() => setCronogramaOk(null), 8000)
    } catch (e) {
      setCronogramaError({
        comboId,
        nombre,
        message: e.message || 'No se pudo guardar el cronograma',
      })
      await refresh({ silent: true, scope: 'combos' })
      window.setTimeout(() => setCronogramaError(null), 8000)
    }
  }

  const handleCompletarTarea = async (comboId, fecha) => {
    await marcarComboCompletado(comboId, fecha || fechaHoy)
    await refresh({ silent: true, scope: 'tareas' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteBitacoraRegistro(deleteTarget.id)
    setDeleteTarget(null)
    await refresh({ silent: true, scope: 'historial' })
  }

  const handleDeleteComboConfirm = async () => {
    if (!deleteComboTarget) return
    await deleteCombo(deleteComboTarget.id)
    setDeleteComboTarget(null)
    await refresh({ silent: true, scope: 'combos+tareas' })
  }

  return (
    <section className="bitacora-panel">
      <div className="bitacora-panel__head">
        <div className="bitacora-panel__title-wrap">
          <ClipboardPen size={22} />
          <div>
            <h2 className="bitacora-panel__title">Bitácora de labores</h2>
            <p className="bitacora-panel__subtitle">
              Combos, cronograma y registro de labores
            </p>
          </div>
        </div>
        <div className="bitacora-panel__head-actions">
          {tab === TAB_HISTORIAL && (
            <button
              type="button"
              className="bitacora-panel__add-btn bitacora-panel__add-btn--ghost"
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              <Plus size={18} />
              Nueva labor
            </button>
          )}
          {tab === TAB_COMBOS && (
            <button
              type="button"
              className="bitacora-panel__add-btn bitacora-panel__add-btn--ghost"
              onClick={() => setCategoriaModalOpen(true)}
            >
              <Plus size={18} />
              Nueva categoría
            </button>
          )}
        </div>
      </div>

      <nav className="bitacora-panel__tabs">
        <button
          type="button"
          className={`bitacora-tab ${tab === TAB_HOY ? 'bitacora-tab--active' : ''}`}
          onClick={() => setTab(TAB_HOY)}
        >
          <Calendar size={16} />
          Hoy
          {totalPendientes > 0 && (
            <span className="bitacora-tab__badge">{totalPendientes}</span>
          )}
        </button>
        <button
          type="button"
          className={`bitacora-tab ${tab === TAB_COMBOS ? 'bitacora-tab--active' : ''}`}
          onClick={() => setTab(TAB_COMBOS)}
        >
          <Layers size={16} />
          Combos
        </button>
        <button
          type="button"
          className={`bitacora-tab ${tab === TAB_HISTORIAL ? 'bitacora-tab--active' : ''}`}
          onClick={() => setTab(TAB_HISTORIAL)}
        >
          <Calendar size={16} />
          Historial
        </button>
      </nav>

      <div className={`bitacora-panel__body ${tab === TAB_COMBOS ? 'bitacora-panel__body--combos' : ''}`}>
        {loading ? (
          <p className="bitacora-panel__empty">Cargando…</p>
        ) : loadError ? (
          <p className="bitacora-panel__empty" role="alert">{loadError}</p>
        ) : tab === TAB_HOY ? (
          <>
            <header className="bitacora-hoy-resumen">
              <h3 className="bitacora-hoy-resumen__title">Resumen del día</h3>
              <p className="bitacora-hoy-resumen__fecha">{formatFechaBitacora(fechaHoy)}</p>
              {riegosHoyTotal > 0 ? (
                <p className="bitacora-hoy-resumen__stats">
                  <strong>{riegosHoyTotal}</strong> riego{riegosHoyTotal !== 1 ? 's' : ''} programado{riegosHoyTotal !== 1 ? 's' : ''} hoy
                  {riegosHoyHechos > 0 && (
                    <span className="bitacora-hoy-resumen__hechos">
                      {' · '}{riegosHoyHechos} confirmado{riegosHoyHechos !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              ) : (
                <p className="bitacora-hoy-resumen__stats bitacora-hoy-resumen__stats--vacio">
                  Ningún riego programado para hoy
                </p>
              )}
            </header>

            {tareasPendientesConfirmacion.length > 0 && (
              <section className="bitacora-hoy-section bitacora-hoy-section--atrasadas">
                <h3 className="bitacora-hoy-section__title">Pendientes de confirmar</h3>
                <ul className="bitacora-list">
                  {tareasPendientesConfirmacion.map((t) => (
                    <ComboConfirmacionCard
                      key={`pend-${t.comboId}-${t.fecha}`}
                      tarea={t}
                      onConfirmar={handleCompletarTarea}
                      onPosponer={() => {}}
                    />
                  ))}
                </ul>
              </section>
            )}

            {tareasHoy.length > 0 ? (
              <section className="bitacora-hoy-section">
                <h3 className="bitacora-hoy-section__title">Riegos de hoy</h3>
                <ul className="bitacora-list">
                  {tareasHoy.map((t) =>
                    t.completado ? (
                      <ComboTareaCard key={t.comboId} tarea={t} />
                    ) : (
                      <ComboConfirmacionCard
                        key={t.comboId}
                        tarea={t}
                        onConfirmar={handleCompletarTarea}
                        onPosponer={() => {}}
                      />
                    ),
                  )}
                </ul>
              </section>
            ) : tareasPendientesConfirmacion.length === 0 ? (
              <p className="bitacora-panel__empty">
                No hay combos con riego activo para este día. Programa un día en Combos → Modificar cronograma.
              </p>
            ) : null}
          </>
        ) : tab === TAB_COMBOS ? (
          categorias.length === 0 ? (
            <p className="bitacora-panel__empty">Cargando categorías…</p>
          ) : (
            <div className="bitacora-combos-scroll-wrap">
              {cronogramaOk && (
                <div className="bitacora-cronograma-ok-banner" role="status">
                  <CheckCircle2 size={18} />
                  <div className="bitacora-cronograma-ok-banner__text">
                    <strong>Cronograma guardado — {cronogramaOk.nombre}</strong>
                    {cronogramaOk.diasSemana?.length ? (
                      <>
                        <span> Riego {formatDiasSemana(cronogramaOk.diasSemana)} · Alarmas activas</span>
                        {cronogramaOk.notif && (
                          <span className={`bitacora-cronograma-ok-banner__notif ${cronogramaOk.notif.ok ? 'bitacora-cronograma-ok-banner__notif--ok' : ''}`}>
                            {cronogramaOk.notif.label}
                          </span>
                        )}
                      </>
                    ) : (
                      <span> Solo consulta (sin alarmas)</span>
                    )}
                  </div>
                </div>
              )}
              {cronogramaError && (
                <div className="bitacora-cronograma-err-banner" role="alert">
                  <strong>No se guardó — {cronogramaError.nombre}</strong>
                  <span> {cronogramaError.message}</span>
                </div>
              )}
              <p className="bitacora-combos-scroll-hint">Desliza → entre categorías · Desliza ↓ para ver todo el contenido</p>
              <div className="bitacora-combos-grid" ref={combosScrollRef}>
              {categorias.map((cat) => {
                const catCombos = combosPorCategoria.get(cat.id) ?? []
                return (
                  <section key={cat.id} className="bitacora-combos-column">
                    <header className="bitacora-combos-column__head">
                      <h3 className="bitacora-combos-column__title">{cat.nombre}</h3>
                      <button
                        type="button"
                        className="bitacora-combos-column__add"
                        onClick={() => {
                          setEditingCombo(null)
                          setNewComboCategoriaId(cat.id)
                          setNewComboCategoriaNombre(cat.nombre)
                          setComboModalOpen(true)
                        }}
                      >
                        <Plus size={16} />
                        Combo
                      </button>
                    </header>
                    {catCombos.length === 0 ? (
                      <p className="bitacora-combos-column__empty">Sin combos en {cat.nombre}</p>
                    ) : (
                      <div className="bitacora-combos-column__list">
                        {catCombos.map((combo) => (
                          <ComboCard
                            key={combo.id}
                            combo={combo}
                            recienGuardado={cronogramaOk?.comboId === combo.id}
                            onEdit={(c) => {
                              setEditingCombo(c)
                              setNewComboCategoriaId(c.categoriaId)
                              setNewComboCategoriaNombre(c.categoriaNombre || cat.nombre)
                              setComboModalOpen(true)
                            }}
                            onDelete={setDeleteComboTarget}
                            onCronograma={setCronogramaCombo}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
              <section className="bitacora-combos-column bitacora-combos-column--add">
                <button
                  type="button"
                  className="bitacora-combos-column__add-cat"
                  onClick={() => setCategoriaModalOpen(true)}
                >
                  <Plus size={20} />
                  Agregar categoría
                </button>
                <p className="bitacora-combos-column__add-hint">
                  Ceniza, árboles u otra sección aparte de Follaje y Flor.
                </p>
              </section>
              </div>
            </div>
          )
        ) : (
          <>
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

            {filtered.length === 0 ? (
              <p className="bitacora-panel__empty">
                {registros.length === 0
                  ? 'Aún no hay labores registradas.'
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
          </>
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

      {comboModalOpen && (
        <ComboFormModal
          initial={editingCombo}
          categoriaId={newComboCategoriaId}
          categoriaNombre={newComboCategoriaNombre}
          onSave={handleComboSave}
          onCancel={() => {
            setComboModalOpen(false)
            setEditingCombo(null)
            setNewComboCategoriaId(null)
            setNewComboCategoriaNombre('')
          }}
        />
      )}

      {categoriaModalOpen && (
        <AddCategoriaModal
          onSaved={async () => {
            setCategoriaModalOpen(false)
            await refresh({ silent: true, scope: 'combos' })
          }}
          onCancel={() => setCategoriaModalOpen(false)}
        />
      )}

      {cronogramaCombo && (
        <CronogramaModal
          combo={cronogramaCombo}
          onSave={handleCronogramaSave}
          onCancel={() => setCronogramaCombo(null)}
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

      {deleteComboTarget && (
        <SpecialKeyModal
          title="Eliminar combo"
          message={`Ingresa la clave especial para eliminar el combo «${deleteComboTarget.nombre}».`}
          confirmLabel="Eliminar"
          onConfirm={handleDeleteComboConfirm}
          onCancel={() => setDeleteComboTarget(null)}
        />
      )}
    </section>
  )
}
