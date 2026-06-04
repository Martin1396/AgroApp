import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { addVenta, getActiveVentas } from '../utils/sales'
import AddVentaModal from './AddVentaModal'
import VentaCard from './VentaCard'
import './VentasPanel.css'

export default function VentasPanel() {
  const [ventas, setVentas] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loadError, setLoadError] = useState('')

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const items = await getActiveVentas()
      setVentas(items)
    } catch (e) {
      setLoadError(e.message || 'No se pudieron cargar las ventas')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSave = async (data) => {
    await addVenta(data)
    await refresh()
    setModalOpen(false)
  }

  return (
    <section className="ventas-panel">
      <div className="ventas-panel__toolbar">
        <button type="button" className="ventas-panel__add-btn" onClick={() => setModalOpen(true)}>
          <Plus size={20} strokeWidth={2.5} />
          Agregar venta
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
        <AddVentaModal onSave={handleSave} onCancel={() => setModalOpen(false)} />
      )}
    </section>
  )
}
