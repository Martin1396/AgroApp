import { useCallback, useEffect, useState } from 'react'
import { List, Plus } from 'lucide-react'
import { useLiveRefresh } from '../hooks/useLiveRefresh'
import { addVenta, getActiveVentas } from '../utils/sales'
import AddVentaModal from './AddVentaModal'
import VentasCatalogosModal from './VentasCatalogosModal'
import VentaCard from './VentaCard'
import './VentasPanel.css'
import './VentasCatalogosModal.css'

export default function VentasPanel() {
  const [ventas, setVentas] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [catalogosOpen, setCatalogosOpen] = useState(false)
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0)
  const [loadError, setLoadError] = useState('')

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadError('')
    try {
      const items = await getActiveVentas()
      setVentas(items)
    } catch (e) {
      if (!silent) setLoadError(e.message || 'No se pudieron cargar las ventas')
    }
  }, [])

  useLiveRefresh(refresh, !modalOpen && !catalogosOpen)

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSave = async (data) => {
    await addVenta(data)
    await refresh()
    setModalOpen(false)
  }

  const handleCatalogUpdate = () => {
    setCatalogRefreshKey((n) => n + 1)
  }

  return (
    <section className="ventas-panel">
      <div className="ventas-panel__toolbar">
        <button type="button" className="ventas-panel__add-btn" onClick={() => setModalOpen(true)}>
          <Plus size={20} strokeWidth={2.5} />
          Agregar venta
        </button>
        <button
          type="button"
          className="ventas-panel__catalog-btn"
          onClick={() => setCatalogosOpen(true)}
        >
          <List size={18} />
          Comercializadoras y variedades
        </button>
      </div>

      <div className="ventas-panel__body">
        {loadError ? (
          <p className="ventas-panel__empty" role="alert">
            {loadError}. Espera unos segundos y recarga la página.
          </p>
        ) : ventas.length === 0 ? (
          <p className="ventas-panel__empty">
            No hay ventas registradas. Pulsa &quot;Agregar venta&quot; para crear una.
          </p>
        ) : (
          <ul className="ventas-list">
            {ventas.map((item) => (
              <VentaCard key={item.id} item={item} onUpdate={refresh} />
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <AddVentaModal
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          onOpenCatalogos={() => setCatalogosOpen(true)}
          catalogRefreshKey={catalogRefreshKey}
        />
      )}

      {catalogosOpen && (
        <VentasCatalogosModal
          onClose={() => setCatalogosOpen(false)}
          onUpdate={handleCatalogUpdate}
        />
      )}
    </section>
  )
}
