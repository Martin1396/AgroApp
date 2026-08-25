import { RefreshCw, TrendingUp } from 'lucide-react'
import './VentasDolarHoy.css'

function formatTasa(rate) {
  const n = Number(rate) || 0
  return n.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFechaTasa(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return null
  }
}

export default function VentasDolarHoy({ tasaInfo, loading, error, onRefresh }) {
  const tasa = tasaInfo?.rate ?? null
  const fechaTasa = formatFechaTasa(tasaInfo?.updatedAt)
  const esVivo = tasaInfo?.source === 'live'

  return (
    <section className="ventas-dolar-hoy" aria-label="Dólar hoy en Colombia">
      <div className="ventas-dolar-hoy__head">
        <TrendingUp size={20} />
        <div>
          <h3 className="ventas-dolar-hoy__title">Dólar hoy en Colombia</h3>
          <p className="ventas-dolar-hoy__badge">
            {loading ? 'Consultando…' : esVivo ? 'En vivo' : 'Referencia'}
          </p>
        </div>
        <button
          type="button"
          className="ventas-dolar-hoy__refresh"
          onClick={() => onRefresh?.({ forceRefresh: true })}
          aria-label="Actualizar tasa del dólar"
          title="Actualizar"
        >
          <RefreshCw size={16} className={loading ? 'ventas-dolar-hoy__refresh--spin' : ''} />
        </button>
      </div>

      <p className="ventas-dolar-hoy__rate">
        {loading && !tasa ? (
          'Cargando tasa…'
        ) : (
          <>
            <span className="ventas-dolar-hoy__rate-label">1 USD =</span>
            <strong>{formatTasa(tasa ?? 4000)} COP</strong>
          </>
        )}
      </p>

      <p className="ventas-dolar-hoy__meta">
        {esVivo && fechaTasa
          ? `Actualizado ${fechaTasa}`
          : tasaInfo?.source === 'config'
            ? 'Tasa de respaldo (sin conexión externa)'
            : 'Se usa para convertir ventas en USD ↔ COP'}
      </p>

      {error ? <p className="ventas-dolar-hoy__error">{error}</p> : null}
    </section>
  )
}
