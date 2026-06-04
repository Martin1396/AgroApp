import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react'
import InventarioIngresosTab from './inventario/InventarioIngresosTab'
import InventarioSalidasTab from './inventario/InventarioSalidasTab'
import InventarioStockTab from './inventario/InventarioStockTab'
import './InventarioPanel.css'

const TABS = [
  { id: 'stock', label: 'Inventario', icon: Package },
  { id: 'ingresos', label: 'Ingresos', icon: ArrowDownCircle },
  { id: 'salidas', label: 'Salidas', icon: ArrowUpCircle },
]

export default function InventarioPanel() {
  const [tab, setTab] = useState('stock')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey((n) => n + 1)

  return (
    <section className="inventario-panel">
      <nav className="inventario-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`inventario-tabs__btn ${tab === id ? 'inventario-tabs__btn--active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="inventario-panel__content">
        {tab === 'stock' && <InventarioStockTab refreshKey={refreshKey} onUpdate={refresh} />}
        {tab === 'ingresos' && <InventarioIngresosTab onUpdate={refresh} />}
        {tab === 'salidas' && <InventarioSalidasTab onUpdate={refresh} />}
      </div>
    </section>
  )
}
