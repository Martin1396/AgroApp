import { useCallback, useEffect, useRef, useState } from 'react'
import { BedDouble, BarChart3, Calendar, ClipboardList, Flower2, ShoppingCart, Trash2 } from 'lucide-react'
import { clearHistorialProductions, formatFecha, getHistorialProductions, getTotalCortes } from '../utils/productions'
import {
  clearHistorialVentas,
  formatMonto,
  getHistorialVentas,
  getReporteVentasTotales,
  getTipoFlorLabel,
  MONEDA,
} from '../utils/sales'
import SpecialKeyModal from './SpecialKeyModal'
import './HistorialPanel.css'

const TABS = [
  { id: 'produccion', label: 'Producción', icon: Flower2 },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { id: 'reporte', label: 'Reporte', icon: BarChart3 },
]

function HistorialProduccion({ historial, onClearRequest }) {
  if (historial.length === 0) {
    return (
      <p className="historial-panel__empty">
        No hay producciones finalizadas en el historial.
      </p>
    )
  }

  return (
    <>
      <div className="historial-panel__section-actions">
        <button type="button" className="historial-panel__clear-btn" onClick={onClearRequest}>
          <Trash2 size={16} />
          Limpiar historial
        </button>
      </div>
      <ul className="historial-list">
        {historial.map((item) => {
          const total = getTotalCortes(item.cortes)
          return (
            <li key={item.id} className="historial-card">
              <div className="historial-card__top">
                <span className="historial-card__code">Producción {item.code}</span>
                <span className="historial-card__badge">Finalizada</span>
              </div>
              <div className="historial-card__summary">
                <p>
                  <BedDouble size={16} />
                  Camas <strong>{item.desdeCama}</strong> a <strong>{item.hastaCama}</strong>
                </p>
                <p>
                  <Flower2 size={16} />
                  Flores cortadas: <strong>{total.toLocaleString('es')}</strong>
                </p>
              </div>
              <dl className="historial-card__dates">
                <div>
                  <dt><Calendar size={14} /> Inicio</dt>
                  <dd>{formatFecha(item.createdAt)}</dd>
                </div>
                <div>
                  <dt><Calendar size={14} /> Finalización</dt>
                  <dd>{formatFecha(item.fechaFinalizacion)}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function HistorialVentas({ historial, onClearRequest }) {
  if (historial.length === 0) {
    return (
      <p className="historial-panel__empty">
        No hay ventas confirmadas en el historial.
      </p>
    )
  }

  return (
    <>
      <div className="historial-panel__section-actions">
        <button type="button" className="historial-panel__clear-btn" onClick={onClearRequest}>
          <Trash2 size={16} />
          Limpiar historial
        </button>
      </div>
      <ul className="historial-list">
        {historial.map((item) => {
          const totalTallos = item.variedades.reduce((s, v) => s + v.tallos, 0)
          return (
            <li key={item.id} className="historial-card historial-card--venta">
              <div className="historial-card__top">
                <span className="historial-card__code">Venta {item.sequence}</span>
                <span className="historial-card__badge historial-card__badge--venta">Pagada</span>
              </div>
              <div className="historial-card__summary">
                <p>
                  <ShoppingCart size={16} />
                  Cliente: <strong>{item.cliente}</strong>
                </p>
                {item.tipoFlor && (
                  <p>
                    Tipo de flor: <strong>{getTipoFlorLabel(item.tipoFlor)}</strong>
                  </p>
                )}
                <p>
                  Precio:{' '}
                  <strong>{formatMonto(item.precioVenta, item.moneda ?? MONEDA.COP)}</strong>
                </p>
                <p>
                  Tallos: <strong>{totalTallos.toLocaleString('es')}</strong>
                </p>
                <p className="historial-card__prod-ref">{item.productionLabel}</p>
                {item.comprobanteNombre && (
                  <p>Comprobante: <strong>{item.comprobanteNombre}</strong></p>
                )}
              </div>
              <dl className="historial-card__dates">
                <div>
                  <dt><Calendar size={14} /> Registro</dt>
                  <dd>{formatFecha(item.createdAt)}</dd>
                </div>
                <div>
                  <dt><Calendar size={14} /> Pago confirmado</dt>
                  <dd>{formatFecha(item.fechaPagoConfirmado)}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function HistorialReporte({ reporte }) {
  const { cantidadVentas, totalCop, totalUsd, ventasCop, ventasUsd } = reporte

  if (cantidadVentas === 0) {
    return (
      <p className="historial-panel__empty">
        Aún no hay ventas con pago confirmado. Cuando confirmes pagos en Ventas, el resumen
        aparecerá aquí.
      </p>
    )
  }

  return (
    <div className="historial-reporte">
      <p className="historial-reporte__intro">
        Total generado por ventas con pago confirmado hasta la fecha.
      </p>

      <div className="historial-reporte__grid">
        <article className="historial-reporte__card historial-reporte__card--cop">
          <span className="historial-reporte__label">Pesos colombianos (COP)</span>
          <p className="historial-reporte__amount">{formatMonto(totalCop, MONEDA.COP)}</p>
          <p className="historial-reporte__meta">
            {ventasCop} venta{ventasCop !== 1 ? 's' : ''} en pesos
          </p>
        </article>

        <article className="historial-reporte__card historial-reporte__card--usd">
          <span className="historial-reporte__label">Dólares (USD)</span>
          <p className="historial-reporte__amount">{formatMonto(totalUsd, MONEDA.USD)}</p>
          <p className="historial-reporte__meta">
            {ventasUsd} venta{ventasUsd !== 1 ? 's' : ''} en dólares
          </p>
        </article>
      </div>

      <p className="historial-reporte__total-ventas">
        <BarChart3 size={18} />
        {cantidadVentas} venta{cantidadVentas !== 1 ? 's' : ''} confirmada{cantidadVentas !== 1 ? 's' : ''} en total
      </p>
    </div>
  )
}

export default function HistorialPanel() {
  const [tab, setTab] = useState('produccion')
  const [clearAction, setClearAction] = useState(null)
  const [historialProd, setHistorialProd] = useState([])
  const [historialVentas, setHistorialVentas] = useState([])
  const [reporte, setReporte] = useState({
    cantidadVentas: 0,
    totalCop: 0,
    totalUsd: 0,
    ventasCop: 0,
    ventasUsd: 0,
  })
  const [loadingTab, setLoadingTab] = useState(false)
  const loadedTabs = useRef(new Set())

  const loadTab = useCallback(async (tabId, force = false) => {
    if (!force && loadedTabs.current.has(tabId)) return

    setLoadingTab(true)
    try {
      if (tabId === 'produccion') {
        const prod = await getHistorialProductions()
        setHistorialProd(prod)
      } else if (tabId === 'ventas') {
        const ventas = await getHistorialVentas()
        setHistorialVentas(ventas)
      } else if (tabId === 'reporte') {
        const rep = await getReporteVentasTotales()
        setReporte(rep)
      }
      loadedTabs.current.add(tabId)
    } finally {
      setLoadingTab(false)
    }
  }, [])

  useEffect(() => {
    loadTab(tab)
  }, [tab, loadTab])

  const handleClearConfirm = async () => {
    if (clearAction === 'produccion') await clearHistorialProductions()
    if (clearAction === 'ventas') await clearHistorialVentas()
    setClearAction(null)
    loadedTabs.current.delete(clearAction)
    await loadTab(clearAction, true)
  }

  return (
    <section className="historial-panel">
      <div className="historial-panel__toolbar">
        <div className="historial-panel__header">
          <ClipboardList size={22} />
          <h2 className="historial-panel__title">Historial</h2>
        </div>
      </div>

      <nav className="historial-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`historial-tabs__btn ${tab === id ? 'historial-tabs__btn--active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="historial-panel__body">
        {loadingTab && (
          <p className="historial-panel__empty">Cargando…</p>
        )}
        {!loadingTab && tab === 'produccion' && (
          <HistorialProduccion
            historial={historialProd}
            onClearRequest={() => setClearAction('produccion')}
          />
        )}
        {!loadingTab && tab === 'ventas' && (
          <HistorialVentas
            historial={historialVentas}
            onClearRequest={() => setClearAction('ventas')}
          />
        )}
        {!loadingTab && tab === 'reporte' && <HistorialReporte reporte={reporte} />}
      </div>

      {clearAction && (
        <SpecialKeyModal
          title="Limpiar historial"
          message="Ingresa la clave especial para borrar el historial seleccionado."
          confirmLabel="Limpiar"
          onConfirm={handleClearConfirm}
          onCancel={() => setClearAction(null)}
        />
      )}
    </section>
  )
}
