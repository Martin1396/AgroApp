import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bug,
  ChevronRight,
  FlaskConical,
  Hammer,
  Leaf,
  Package,
  Plus,
  Search,
  Sprout,
  Tags,
  Trash2,
  Wrench,
  ClipboardList,
} from 'lucide-react'
import { useLiveRefresh } from '../../hooks/useLiveRefresh'
import {
  addProductoInventario,
  CATEGORIA,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  deleteProducto,
  getCategoriaLabel,
  getProductos,
  productoTieneMetodoUso,
  updateProductoCategoria,
  updateProductoMetodoUso,
} from '../../utils/inventory'
import AddProductoInventarioModal from './AddProductoInventarioModal'
import EditProductoCategoriaModal from './EditProductoCategoriaModal'
import MetodoUsoModal from './MetodoUsoModal'
import SpecialKeyModal from '../SpecialKeyModal'
import './InventarioStockTab.css'
import './ProductoBusquedaField.css'

const CATEGORIA_ICON = {
  [CATEGORIA.FERTILIZANTE]: Sprout,
  [CATEGORIA.FUNGICIDA]: FlaskConical,
  [CATEGORIA.INSECTICIDA]: Bug,
  [CATEGORIA.ABONO]: Leaf,
  [CATEGORIA.HERBICIDA]: Leaf,
  [CATEGORIA.HERRAMIENTA]: Wrench,
  [CATEGORIA.MATERIAL]: Package,
  quimico: FlaskConical,
}

function formatCantidad(stock, unidad) {
  const n = Number(stock) || 0
  return `${n.toLocaleString('es')} ${unidad || 'unidad'}`
}

function sortProductos(items) {
  return [...items].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
}

function normalizeCategoria(categoria) {
  if (categoria === 'quimico') return CATEGORIA.FUNGICIDA
  return categoria
}

function matchesCategoriaFiltro(producto, filtroCategoria) {
  if (!filtroCategoria || filtroCategoria === 'todos') return true
  return normalizeCategoria(producto.categoria) === filtroCategoria
}

export default function InventarioStockTab({ refreshKey = 0, onUpdate }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [productToEdit, setProductToEdit] = useState(null)
  const [productMetodoUso, setProductMetodoUso] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteNotice, setDeleteNotice] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [filtroCategoria, setFiltroCategoria] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [tick, setTick] = useState(0)

  const refresh = () => {
    setTick((n) => n + 1)
    onUpdate?.()
  }

  const [productos, setProductos] = useState([])
  const [loadError, setLoadError] = useState('')

  const loadProductos = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadError('')
    try {
      const items = await getProductos()
      setProductos(items)
    } catch (e) {
      if (!silent) setLoadError(e.message || 'No se pudo cargar el inventario')
    }
  }, [])

  useEffect(() => {
    loadProductos()
  }, [refreshKey, tick, loadProductos])

  useLiveRefresh(loadProductos, !modalOpen && !productToDelete && !productToEdit && !productMetodoUso)

  const listaProductos = useMemo(() => sortProductos(productos), [productos])

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return listaProductos.filter((p) => {
      if (!matchesCategoriaFiltro(p, filtroCategoria)) return false
      if (!q) return true
      return String(p.nombre).toLowerCase().includes(q)
    })
  }, [listaProductos, filtroCategoria, busqueda])

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async (data) => {
    const result = await addProductoInventario(data)
    if (!result.ok) return
    refresh()
    setModalOpen(false)
  }

  const handleDeleteRequest = (producto) => {
    setDeleteError('')
    setDeleteNotice('')
    setProductToDelete(producto)
  }

  const handleEditCategoria = async (categoria) => {
    if (!productToEdit) return
    await updateProductoCategoria(productToEdit.id, categoria)
    setProductToEdit(null)
    refresh()
  }

  const handleSaveMetodoUso = async (metodoUso) => {
    if (!productMetodoUso) return
    await updateProductoMetodoUso(productMetodoUso.id, metodoUso)
    setProductMetodoUso(null)
    refresh()
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    try {
      const result = await deleteProducto(productToDelete.id)
      if (!result?.ok) {
        setDeleteError('No se pudo eliminar el producto')
        return
      }
      const deletedMovs = Number(result.deletedMovimientos || 0)
      const msg =
        deletedMovs > 0
          ? `Se eliminó ${productToDelete.nombre} (y ${deletedMovs} movimiento(s)).`
          : `Se eliminó ${productToDelete.nombre}.`
      setDeleteNotice(msg)
      setProductToDelete(null)
      refresh()
      window.setTimeout(() => setDeleteNotice(''), 4500)
    } catch (e) {
      setDeleteError(e.message || 'No se pudo eliminar el producto')
    }
  }

  return (
    <div className="inventario-stock">
      <div className="inventario-stock__head">
        <h2 className="inventario-stock__title">Inventario</h2>
        <button type="button" className="inventario-stock__add-btn" onClick={() => setModalOpen(true)}>
          <Plus size={18} strokeWidth={2.5} />
          Agregar producto
        </button>
      </div>

      {loadError ? (
        <p className="inventario-stock__empty" role="alert">
          {loadError}. Espera unos segundos y recarga la página.
        </p>
      ) : listaProductos.length === 0 ? (
        <p className="inventario-stock__empty">
          No hay productos registrados. Pulsa &quot;Agregar producto&quot; para crear el primero.
        </p>
      ) : (
        <>
          <div className="inventario-stock__filters">
            <div className="inventario-stock__search">
              <Search size={18} />
              <input
                type="search"
                className="inventario-stock__search-input"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="inventario-stock__cat-filters" role="tablist" aria-label="Filtrar por categoría">
              <button
                type="button"
                role="tab"
                aria-selected={filtroCategoria === 'todos'}
                className={`inventario-stock__cat-btn ${filtroCategoria === 'todos' ? 'inventario-stock__cat-btn--active' : ''}`}
                onClick={() => setFiltroCategoria('todos')}
              >
                Todos
              </button>
              {CATEGORIA_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={filtroCategoria === cat}
                  className={`inventario-stock__cat-btn ${filtroCategoria === cat ? 'inventario-stock__cat-btn--active' : ''}`}
                  onClick={() => setFiltroCategoria(cat)}
                >
                  {CATEGORIA_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {productosFiltrados.length === 0 ? (
            <p className="inventario-stock__empty">
              No hay productos con ese filtro. Prueba otra categoría o borra la búsqueda.
            </p>
          ) : (
        <section className="inventario-section inventario-section--flat">
          <header className="inventario-section__header">
            <div className="inventario-section__title-wrap">
              <span className="inventario-section__icon">
                <Package size={20} />
              </span>
              <h3 className="inventario-section__title">
                {filtroCategoria === 'todos'
                  ? 'Todos los productos'
                  : CATEGORIA_LABELS[filtroCategoria]}
              </h3>
              <span className="inventario-section__count">{productosFiltrados.length}</span>
            </div>
            <span className="inventario-section__col-label">Cantidad</span>
          </header>

          <ul className="inventario-section__list">
            {productosFiltrados.map((p) => {
              const expanded = expandedIds.has(p.id)
              const hasDetails = Boolean(p.descripcion?.trim())
              const RowIcon = CATEGORIA_ICON[p.categoria] ?? Package

              return (
                <li
                  key={p.id}
                  className={`inventario-section__row ${expanded ? 'inventario-section__row--expanded' : ''}`}
                >
                  <div className="inventario-section__row-left">
                    <span className="inventario-section__row-icon">
                      <RowIcon size={18} />
                    </span>
                    <div className="inventario-section__row-text">
                      <button
                        type="button"
                        className="inventario-section__row-head"
                        onClick={() => toggleExpanded(p.id)}
                        aria-expanded={expanded}
                      >
                        <ChevronRight
                          size={16}
                          className={`inventario-section__chevron ${expanded ? 'inventario-section__chevron--open' : ''}`}
                        />
                        <span className="inventario-section__name">
                          <span className="inventario-section__unit">{p.unidad || 'unidad'}</span>
                          <span className="inventario-section__cat-badge">
                            {getCategoriaLabel(p.categoria)}
                          </span>
                          {p.nombre}
                        </span>
                      </button>
                      {expanded && (
                        <div className="inventario-section__details">
                          {hasDetails ? (
                            <p>
                              <strong>Descripción:</strong> {p.descripcion}
                            </p>
                          ) : (
                            <p>Sin descripción adicional.</p>
                          )}
                          {p.metodoUso?.trim() && (
                            <p>
                              <strong>Método de uso:</strong> {p.metodoUso}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="inventario-section__row-actions">
                    <span className="inventario-section__qty">{formatCantidad(p.stock, p.unidad)}</span>
                    {productoTieneMetodoUso(p.categoria) && (
                      <button
                        type="button"
                        className={`inventario-section__metodo ${p.metodoUso?.trim() ? 'inventario-section__metodo--filled' : ''}`}
                        onClick={() => setProductMetodoUso(p)}
                      >
                        <ClipboardList size={14} />
                        Método de uso
                      </button>
                    )}
                    <button
                      type="button"
                      className="inventario-section__edit"
                      onClick={() => setProductToEdit(p)}
                    >
                      <Tags size={14} />
                      Categoría
                    </button>
                    <button
                      type="button"
                      className="inventario-section__delete"
                      onClick={() => handleDeleteRequest(p)}
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
          )}
        </>
      )}

      {deleteNotice && (
        <div className="inventario-stock__notice" role="status">
          {deleteNotice}
        </div>
      )}

      {productToDelete &&
        createPortal(
          <SpecialKeyModal
            title="Eliminar producto"
            message={
              deleteError
                ? `No se pudo eliminar: ${deleteError}`
                : `Ingresa la clave especial para eliminar el producto ${productToDelete.nombre}.`
            }
            confirmLabel="Eliminar"
            onConfirm={handleDeleteConfirm}
            onCancel={() => {
              setProductToDelete(null)
              setDeleteError('')
            }}
          />,
          document.body,
        )}

      {productMetodoUso &&
        createPortal(
          <MetodoUsoModal
            producto={productMetodoUso}
            onSave={handleSaveMetodoUso}
            onCancel={() => setProductMetodoUso(null)}
          />,
          document.body,
        )}

      {productToEdit &&
        createPortal(
          <EditProductoCategoriaModal
            producto={productToEdit}
            onSave={handleEditCategoria}
            onCancel={() => setProductToEdit(null)}
          />,
          document.body,
        )}

      {modalOpen &&
        createPortal(
          <AddProductoInventarioModal onSave={handleSave} onCancel={() => setModalOpen(false)} />,
          document.body,
        )}
    </div>
  )
}
