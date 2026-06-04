import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FlaskConical, Hammer, Package, Plus, Sprout, Trash2, Wrench } from 'lucide-react'
import {
  addProductoInventario,
  CATEGORIA,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  compareProductCodes,
  deleteProducto,
  getProductos,
} from '../../utils/inventory'
import AddProductoInventarioModal from './AddProductoInventarioModal'
import SpecialKeyModal from '../SpecialKeyModal'
import './InventarioStockTab.css'

const CATEGORIA_SECTION = {
  [CATEGORIA.QUIMICO]: { icon: FlaskConical, rowIcon: FlaskConical },
  [CATEGORIA.ABONO]: { icon: Sprout, rowIcon: Package },
  [CATEGORIA.HERRAMIENTA]: { icon: Wrench, rowIcon: Hammer },
}

function formatCantidad(stock, unidad) {
  const n = Number(stock) || 0
  return `${n.toLocaleString('es')} ${unidad || 'unidad'}`
}

export default function InventarioStockTab({ refreshKey = 0, onUpdate }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleteNotice, setDeleteNotice] = useState('')
  const [tick, setTick] = useState(0)

  const refresh = () => {
    setTick((n) => n + 1)
    onUpdate?.()
  }

  const [productos, setProductos] = useState([])

  useEffect(() => {
    getProductos().then(setProductos)
  }, [refreshKey, tick])

  const grupos = useMemo(
    () =>
      CATEGORIA_ORDER.map((categoria) => ({
        categoria,
        label: CATEGORIA_LABELS[categoria],
        items: productos
          .filter((p) => p.categoria === categoria)
          .sort(compareProductCodes),
      })).filter((g) => g.items.length > 0),
    [productos],
  )

  const totalProductos = grupos.reduce((s, g) => s + g.items.length, 0)

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
          ? `Se eliminó ${productToDelete.code} — ${productToDelete.nombre} (y ${deletedMovs} movimiento(s)).`
          : `Se eliminó ${productToDelete.code} — ${productToDelete.nombre}.`
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

      {totalProductos === 0 ? (
        <p className="inventario-stock__empty">
          No hay productos registrados. Pulsa &quot;Agregar producto&quot; para crear el primero.
        </p>
      ) : (
        <div className="inventario-stock__sections">
          {grupos.map((grupo) => {
            const SectionIcon = CATEGORIA_SECTION[grupo.categoria]?.icon ?? Package
            const RowIcon = CATEGORIA_SECTION[grupo.categoria]?.rowIcon ?? Package

            return (
              <section key={grupo.categoria} className="inventario-section">
                <header className="inventario-section__header">
                  <div className="inventario-section__title-wrap">
                    <span className="inventario-section__icon">
                      <SectionIcon size={20} />
                    </span>
                    <h3 className="inventario-section__title">{grupo.label}</h3>
                  </div>
                  <span className="inventario-section__col-label">Cantidad</span>
                </header>

                <ul className="inventario-section__list">
                  {grupo.items.map((p) => (
                    <li key={p.id} className="inventario-section__row">
                      <div className="inventario-section__row-left">
                        <span className="inventario-section__row-icon">
                          <RowIcon size={18} />
                        </span>
                        <div className="inventario-section__row-text">
                          <span className="inventario-section__name">
                            <span className="inventario-section__code-inline">{p.code}</span> {p.nombre}
                          </span>
                          {p.descripcion && (
                            <span className="inventario-section__desc">{p.descripcion}</span>
                          )}
                        </div>
                      </div>
                      <div className="inventario-section__row-actions">
                        <span className="inventario-section__qty">
                          {formatCantidad(p.stock, p.unidad)}
                        </span>
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
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
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
                : `Ingresa la clave especial para eliminar el producto ${productToDelete.code} — ${productToDelete.nombre}.`
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

      {modalOpen &&
        createPortal(
          <AddProductoInventarioModal onSave={handleSave} onCancel={() => setModalOpen(false)} />,
          document.body,
        )}
    </div>
  )
}
