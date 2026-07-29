import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatDosisDisplay } from '../../utils/comboDisplay'

export default function ComboProductoItem({ producto }) {
  const [open, setOpen] = useState(false)
  const proposito = producto.proposito?.trim()
  const dosisRaw = producto.dosis?.trim()
  const dosisDisplay = formatDosisDisplay(dosisRaw)
  const dosisDetalle = dosisDisplay?.variant === 'pendiente' ? dosisDisplay.full : ''
  const hasExtra = Boolean(proposito || dosisDetalle)

  return (
    <li className={`bitacora-combo-prod ${hasExtra ? 'bitacora-combo-prod--expandable' : ''}`}>
      <div className="bitacora-combo-prod__main">
        {hasExtra ? (
          <button
            type="button"
            className="bitacora-combo-prod__toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Ocultar detalle' : 'Ver detalle del producto'}
          >
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="bitacora-combo-prod__bullet" aria-hidden />
        )}
        <span className="bitacora-combo-prod__nombre">{producto.nombre}</span>
        {dosisDisplay ? (
          <span
            className={`bitacora-combo-prod__dosis bitacora-combo-prod__dosis--${dosisDisplay.variant}`}
            title={dosisDisplay.title}
          >
            {dosisDisplay.label}
          </span>
        ) : null}
      </div>
      {hasExtra && open && (
        <div className="bitacora-combo-prod__extra-wrap">
          {proposito ? <p className="bitacora-combo-prod__extra">{proposito}</p> : null}
          {dosisDetalle ? (
            <p className="bitacora-combo-prod__extra bitacora-combo-prod__extra--dosis">
              Dosis: {dosisDetalle}
            </p>
          ) : null}
        </div>
      )}
    </li>
  )
}
