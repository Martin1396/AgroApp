import { CalendarClock, CircleCheck } from 'lucide-react'
import { formatFechaVenta, formatMonto, MONEDA } from '../utils/sales'
import './VentasCierreMes.css'

function formatFechaCierre(iso) {
  if (!iso) return 'el inicio'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function VentasCierreMes({ estado, tasa }) {
  if (!estado) return null

  const periodo = estado.periodoActual
  const ultimo = estado.ultimoCierre
  const n = periodo?.cantidadVentas ?? 0
  const created = estado.created ?? []

  return (
    <div className="venta-cierre">
      <header className="venta-cierre__head">
        <CalendarClock size={20} />
        <div>
          <h3 className="venta-cierre__title">Cierre de mes</h3>
          <p className="venta-cierre__sub">
            Cada 28 se cierra el mes con el TRM de ese día. El periodo actual suma lo posterior
            al último cierre.
          </p>
        </div>
      </header>

      {created.length > 0 && (
        <p className="venta-cierre__banner" role="status">
          <CircleCheck size={16} />
          Se registró el cierre de {estado.cerradoHasta || 'este mes'} con TRM{' '}
          {Number(created[0].trm).toLocaleString('es-CO', { maximumFractionDigits: 2 })}.
        </p>
      )}

      <article className="venta-cierre__card">
        <p className="venta-cierre__label">Periodo actual (después del último cierre)</p>
        <p className="venta-cierre__rango">
          Desde {formatFechaCierre(periodo?.desde)} · TRM actual{' '}
          {Number(tasa || estado.trm || 0).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
        </p>
        <div className="venta-cierre__montos">
          <p>
            <span>Total pesos</span>
            <strong>{formatMonto(periodo?.totalCop, MONEDA.COP)}</strong>
          </p>
          <p>
            <span>Total dólares</span>
            <strong>{formatMonto(periodo?.totalUsd, MONEDA.USD)}</strong>
          </p>
        </div>
        <p className="venta-cierre__meta">
          {n} venta{n !== 1 ? 's' : ''} en este periodo
        </p>
        {periodo?.comercializadoras?.length > 0 && (
          <ul className="venta-cierre__coms">
            {periodo.comercializadoras.map((c) => (
              <li key={c.nombre}>
                <span>{c.nombre}</span>
                <span>
                  {formatMonto(c.totalCop, MONEDA.COP)} · {formatMonto(c.totalUsd, MONEDA.USD)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      {ultimo ? (
        <article className="venta-cierre__card venta-cierre__card--prev">
          <p className="venta-cierre__label">Último cierre · {estado.ultimoCierreEtiqueta}</p>
          <p className="venta-cierre__rango">
            {formatFechaVenta(ultimo.periodoInicio)} — {formatFechaVenta(ultimo.periodoFin)} · TRM{' '}
            {Number(ultimo.trm).toLocaleString('es-CO', { maximumFractionDigits: 2 })}
          </p>
          <div className="venta-cierre__montos">
            <p>
              <span>Total pesos</span>
              <strong>{formatMonto(ultimo.totalCop, MONEDA.COP)}</strong>
            </p>
            <p>
              <span>Total dólares</span>
              <strong>{formatMonto(ultimo.totalUsd, MONEDA.USD)}</strong>
            </p>
          </div>
          <p className="venta-cierre__meta">
            {ultimo.cantidadVentas} venta{ultimo.cantidadVentas !== 1 ? 's' : ''} al cierre
          </p>
        </article>
      ) : (
        <p className="venta-cierre__hint">
          Aún no hay un cierre. El {estado.proximoCierre?.fecha?.slice(8, 10) || '28'} de{' '}
          {estado.proximoCierre?.etiqueta || 'este mes'} se guardará el total de este periodo con el
          TRM de ese día.
        </p>
      )}

      {ultimo && estado.proximoCierre && (
        <p className="venta-cierre__hint">
          Próximo cierre: 28 de {estado.proximoCierre.etiqueta}.
        </p>
      )}
    </div>
  )
}
