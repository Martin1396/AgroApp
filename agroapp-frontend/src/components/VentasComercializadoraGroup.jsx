import { useState } from 'react'
import { ChevronDown, Store } from 'lucide-react'
import { formatMonto, MONEDA } from '../utils/sales'
import VentaCard from './VentaCard'
import './VentasComercializadoraGroup.css'

export default function VentasComercializadoraGroup({ grupo, tasa, onUpdate }) {
  const [open, setOpen] = useState(true)
  const n = grupo.totales.cantidadVentas
  const panelId = `comercializadora-${grupo.nombre.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <section className={`venta-grupo ${open ? 'venta-grupo--open' : ''}`}>
      <button
        type="button"
        className="venta-grupo__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="venta-grupo__title-wrap">
          <Store size={18} />
          <span>
            <span className="venta-grupo__nombre">{grupo.nombre}</span>
            <span className="venta-grupo__count">
              {n} venta{n !== 1 ? 's' : ''}
            </span>
          </span>
        </span>
        <span className="venta-grupo__totales">
          <strong>{formatMonto(grupo.totales.totalCop, MONEDA.COP)}</strong>
          <span>{formatMonto(grupo.totales.totalUsd, MONEDA.USD)}</span>
        </span>
        <ChevronDown size={20} className="venta-grupo__chevron" aria-hidden="true" />
      </button>

      <div id={panelId} className="venta-grupo__body" hidden={!open}>
        <p className="venta-grupo__sum">
          Acumulado de esta comercializadora con TRM actual:{' '}
          <strong>{formatMonto(grupo.totales.totalCop, MONEDA.COP)}</strong>
          {' · '}
          <strong>{formatMonto(grupo.totales.totalUsd, MONEDA.USD)}</strong>
        </p>
        <ul className="ventas-list">
          {grupo.ventas.map((item) => (
            <VentaCard key={item.id} item={item} tasa={tasa} onUpdate={onUpdate} />
          ))}
        </ul>
      </div>
    </section>
  )
}
