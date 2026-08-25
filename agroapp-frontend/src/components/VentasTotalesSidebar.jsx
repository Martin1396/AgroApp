import { useMemo } from 'react'
import { CircleDollarSign } from 'lucide-react'
import {
  buildActiveVentasBreakdown,
  computeActiveVentasTotals,
  formatMonto,
  MONEDA,
} from '../utils/sales'
import './VentasTotalesSidebar.css'

export default function VentasTotalesSidebar({ ventas, tasa = 4000, tasaInfo }) {
  const totales = useMemo(
    () => computeActiveVentasTotals(ventas, tasa),
    [ventas, tasa],
  )
  const lineas = useMemo(
    () => buildActiveVentasBreakdown(ventas, tasa),
    [ventas, tasa],
  )

  const n = totales.cantidadVentas

  return (
    <div className="ventas-totales" aria-label="Total de ventas pendientes de pago">
      <header className="ventas-totales__head">
        <CircleDollarSign size={20} />
        <div>
          <h3 className="ventas-totales__title">Total por cobrar</h3>
          <p className="ventas-totales__subtitle">
            {n} venta{n !== 1 ? 's' : ''} sin confirmar pago
          </p>
          {tasaInfo?.source === 'live' && (
            <p className="ventas-totales__subtitle ventas-totales__subtitle--tasa">
              Conversión con dólar en vivo
            </p>
          )}
        </div>
      </header>

      <div className="ventas-totales__cards">
        <article className="ventas-totales__card ventas-totales__card--cop">
          <span className="ventas-totales__label">Total en pesos</span>
          <p className="ventas-totales__amount">{formatMonto(totales.totalCop, MONEDA.COP)}</p>
          {totales.ventasCop > 0 && (
            <p className="ventas-totales__meta">
              {totales.ventasCop} venta{totales.ventasCop !== 1 ? 's' : ''} en COP:{' '}
              {formatMonto(totales.totalCopNativo, MONEDA.COP)}
            </p>
          )}
        </article>

        <article className="ventas-totales__card ventas-totales__card--usd">
          <span className="ventas-totales__label">Total en dólares</span>
          <p className="ventas-totales__amount">{formatMonto(totales.totalUsd, MONEDA.USD)}</p>
          {totales.ventasUsd > 0 && (
            <p className="ventas-totales__meta">
              {totales.ventasUsd} venta{totales.ventasUsd !== 1 ? 's' : ''} en USD:{' '}
              {formatMonto(totales.totalUsdNativo, MONEDA.USD)}
            </p>
          )}
        </article>
      </div>

      <section className="ventas-totales__detalle">
        <h4 className="ventas-totales__detalle-title">
          Resumen de lo que suma ({n} venta{n !== 1 ? 's' : ''})
        </h4>

        {lineas.length === 0 ? (
          <p className="ventas-totales__detalle-vacio">
            Aún no hay ventas. Al agregar una, su precio aparecerá aquí y se sumará al total.
          </p>
        ) : (
          <ul className="ventas-totales__lista">
            {lineas.map((linea) => (
              <li key={linea.id} className="ventas-totales__linea">
                <div className="ventas-totales__linea-head">
                  <span className="ventas-totales__linea-num">Venta {linea.sequence}</span>
                  <span className="ventas-totales__linea-cliente">{linea.cliente}</span>
                </div>
                <div className="ventas-totales__linea-montos">
                  <span className="ventas-totales__linea-original">
                    + {formatMonto(linea.montoOriginal, linea.moneda)}
                  </span>
                  {linea.moneda === MONEDA.USD ? (
                    <span className="ventas-totales__linea-equiv">
                      = {formatMonto(linea.montoCop, MONEDA.COP)}
                    </span>
                  ) : (
                    <span className="ventas-totales__linea-equiv">
                      = {formatMonto(linea.montoUsd, MONEDA.USD)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="ventas-totales__sumatoria">
          <p className="ventas-totales__sumatoria-label">Sumatoria ({n} ventas)</p>
          {totales.ventasUsd > 0 && (
            <p className="ventas-totales__sumatoria-row">
              <span>USD directo</span>
              <strong>{formatMonto(totales.totalUsdNativo, MONEDA.USD)}</strong>
            </p>
          )}
          {totales.ventasCop > 0 && (
            <p className="ventas-totales__sumatoria-row">
              <span>COP directo</span>
              <strong>{formatMonto(totales.totalCopNativo, MONEDA.COP)}</strong>
            </p>
          )}
          <p className="ventas-totales__sumatoria-row">
            <span>Total COP</span>
            <strong>{formatMonto(totales.totalCop, MONEDA.COP)}</strong>
          </p>
          <p className="ventas-totales__sumatoria-row">
            <span>Total USD</span>
            <strong>{formatMonto(totales.totalUsd, MONEDA.USD)}</strong>
          </p>
        </div>
      </section>
    </div>
  )
}
