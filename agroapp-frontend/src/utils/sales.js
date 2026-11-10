import { apiRequest } from '../api/client'

export const TIPO_FLOR = {
  EXPORTACION: 'exportacion',
  NACIONAL: 'nacional',
}

export const TIPO_FLOR_LABELS = {
  [TIPO_FLOR.EXPORTACION]: 'Exportación',
  [TIPO_FLOR.NACIONAL]: 'Nacional',
}

export function getTipoFlorLabel(tipo) {
  return TIPO_FLOR_LABELS[tipo] ?? ''
}

export const MONEDA = {
  COP: 'cop',
  USD: 'usd',
}

export const MONEDA_LABELS = {
  [MONEDA.COP]: 'COP',
  [MONEDA.USD]: 'USD',
}

export function normalizeMoneda(moneda) {
  return moneda === MONEDA.USD ? MONEDA.USD : MONEDA.COP
}

export function formatMonto(monto, moneda = MONEDA.COP) {
  const n = Number(monto) || 0
  const isUsd = moneda === MONEDA.USD
  const formatted = n.toLocaleString('es-CO', {
    minimumFractionDigits: isUsd ? 2 : 0,
    maximumFractionDigits: isUsd ? 4 : 0,
  })
  if (isUsd) return `USD ${formatted}`
  return `${formatted} COP`
}

export function convertMonto(monto, fromMoneda, toMoneda, tasaUsdCop = 4000) {
  const n = Number(monto) || 0
  const tasa = Number(tasaUsdCop) || 4000
  if (fromMoneda === toMoneda) return n
  if (fromMoneda === MONEDA.USD && toMoneda === MONEDA.COP) return n * tasa
  if (fromMoneda === MONEDA.COP && toMoneda === MONEDA.USD) return n / tasa
  return n
}

export function formatMontoDual(monto, moneda, tasaUsdCop = 4000) {
  const primary = formatMonto(monto, moneda)
  const otherMoneda = moneda === MONEDA.USD ? MONEDA.COP : MONEDA.USD
  const converted = convertMonto(monto, moneda, otherMoneda, tasaUsdCop)
  const secondary = formatMonto(converted, otherMoneda)
  return { primary, secondary }
}

/** Permite escribir precios con coma o punto decimal (ej. 0,34). */
export function sanitizePriceInput(value) {
  let v = String(value ?? '').replace(/[^\d.,]/g, '')
  if (!v) return ''

  let seenSep = false
  let out = ''
  for (const ch of v) {
    if (ch === '.' || ch === ',') {
      if (seenSep) continue
      seenSep = true
      out += ','
    } else {
      out += ch
    }
  }

  const commaIdx = out.indexOf(',')
  if (commaIdx >= 0) {
    const intPart = out.slice(0, commaIdx)
    const decPart = out.slice(commaIdx + 1, commaIdx + 5)
    out = decPart.length || out.endsWith(',') ? `${intPart},${decPart}` : intPart
  }

  return out
}

export function parsePriceInput(value) {
  if (value == null || String(value).trim() === '') return NaN
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

/** Muestra un número guardado en el campo de precio (ej. 0.34 → 0,34). */
export function formatPriceForInput(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (trimmed.includes(',') || trimmed.includes('.')) {
      return sanitizePriceInput(trimmed.replace('.', ','))
    }
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const rounded = Math.round(n * 10000) / 10000
  return sanitizePriceInput(String(rounded).replace('.', ','))
}

function readStoredPrecioUnitario(variedad) {
  if (!variedad) return 0
  const raw = variedad.precioPorUnidad ?? variedad.precio_por_unidad
  if (raw == null || raw === '') return 0
  const n = typeof raw === 'number'
    ? raw
    : parsePriceInput(formatPriceForInput(raw) || String(raw))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Precio por unidad de una variedad.
 * Si en BD quedó en 0 (ventas antiguas con "0,34" mal parseadas),
 * lo reconstruye desde el total de la venta y los tallos.
 */
export function getVariedadPrecioUnitario(variedad, venta = null) {
  const stored = readStoredPrecioUnitario(variedad)
  if (stored > 0) return stored

  const tallos = Number(variedad?.tallos) || 0
  if (!venta || tallos <= 0) return 0

  const ventaTotal = Number(venta.precioVenta) || 0
  if (ventaTotal <= 0) return 0

  const vars = venta.variedades ?? []
  const sumFromStored = vars.reduce(
    (sum, v) => sum + readStoredPrecioUnitario(v) * (Number(v.tallos) || 0),
    0,
  )
  if (sumFromStored > 0) return 0

  if (vars.length === 1) {
    return ventaTotal / tallos
  }

  const totalTallos = vars.reduce((s, v) => s + (Number(v.tallos) || 0), 0)
  if (totalTallos > 0) {
    return ventaTotal / totalTallos
  }

  return 0
}

/** Rellena precioPorUnidad cuando falta en variedades al abrir modificar. */
export function normalizeVentaVariedades(venta) {
  if (!venta?.variedades?.length) return []
  return venta.variedades.map((v) => ({
    ...v,
    precioPorUnidad: getVariedadPrecioUnitario(v, venta),
  }))
}

export function computeVariedadSubtotal(v, venta = null) {
  const pu = getVariedadPrecioUnitario(v, venta)
  const tallos = Number(v.tallos) || 0
  return pu * tallos
}

export function computeVentaTotal(variedades, venta = null) {
  return (variedades ?? []).reduce((sum, v) => sum + computeVariedadSubtotal(v, venta), 0)
}

/** Monto real de la venta: suma de variedades (lo que se ve en la tarjeta). */
export function getVentaMonto(venta) {
  const fromVariedades = computeVentaTotal(venta?.variedades, venta)
  if (fromVariedades > 0) return fromVariedades
  return Number(venta?.precioVenta) || 0
}

/** Suma ventas activas (sin pago) en COP y USD con conversión cruzada. */
export function computeActiveVentasTotals(ventas, tasaUsdCop = 4000) {
  let totalCop = 0
  let totalUsd = 0
  let totalCopNativo = 0
  let totalUsdNativo = 0
  let ventasCop = 0
  let ventasUsd = 0

  for (const venta of ventas ?? []) {
    const monto = getVentaMonto(venta)
    const moneda = normalizeMoneda(venta.moneda)
    if (moneda === MONEDA.USD) {
      ventasUsd += 1
      totalUsdNativo += monto
      totalUsd += monto
      totalCop += convertMonto(monto, MONEDA.USD, MONEDA.COP, tasaUsdCop)
    } else {
      ventasCop += 1
      totalCopNativo += monto
      totalCop += monto
      totalUsd += convertMonto(monto, MONEDA.COP, MONEDA.USD, tasaUsdCop)
    }
  }

  return {
    totalCop,
    totalUsd,
    totalCopNativo,
    totalUsdNativo,
    ventasCop,
    ventasUsd,
    cantidadVentas: (ventas ?? []).length,
  }
}

/** Detalle por venta activa para el resumen desplegable. */
export function buildActiveVentasBreakdown(ventas, tasaUsdCop = 4000) {
  return [...(ventas ?? [])]
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
    .map((venta) => {
      const monto = getVentaMonto(venta)
      const moneda = normalizeMoneda(venta.moneda)
      return {
        id: venta.id,
        sequence: venta.sequence,
        cliente: venta.cliente,
        moneda,
        montoOriginal: monto,
        montoCop:
          moneda === MONEDA.COP
            ? monto
            : convertMonto(monto, MONEDA.USD, MONEDA.COP, tasaUsdCop),
        montoUsd:
          moneda === MONEDA.USD
            ? monto
            : convertMonto(monto, MONEDA.COP, MONEDA.USD, tasaUsdCop),
      }
    })
}

export const MAX_PDF_BYTES = 1_500_000
export const MAX_FACTURA_BYTES = MAX_PDF_BYTES

export async function getSales() {
  const { items } = await apiRequest('/sales')
  return items
}

export function formatFechaVenta(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function groupVentasByComercializadora(ventas, tasaUsdCop = 4000) {
  const map = new Map()
  for (const venta of ventas ?? []) {
    const nombre = String(venta.cliente || '').trim() || 'Sin comercializadora'
    if (!map.has(nombre)) map.set(nombre, [])
    map.get(nombre).push(venta)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([nombre, items]) => {
      const ordenadas = [...items].sort((a, b) => {
        const da = new Date(a.createdAt || 0).getTime()
        const db = new Date(b.createdAt || 0).getTime()
        return db - da
      })
      return {
        nombre,
        ventas: ordenadas,
        totales: computeActiveVentasTotals(ordenadas, tasaUsdCop),
      }
    })
}

export async function getCierresVentas() {
  return apiRequest('/sales/cierres')
}

export async function getActiveVentas() {
  const { items } = await apiRequest('/sales/active')
  return items
}

export async function getHistorialVentas() {
  const { items } = await apiRequest('/sales/historial')
  return items
}

export async function getReporteVentasTotales() {
  return apiRequest('/sales/reporte')
}

export async function addVenta(payload) {
  const { item } = await apiRequest('/sales', { method: 'POST', body: payload })
  return item
}

export async function attachComprobante(ventaId, dataUrl, fileName) {
  const { ok } = await apiRequest(`/sales/${ventaId}/comprobante`, {
    method: 'POST',
    body: { dataUrl, fileName },
  })
  return ok
}

export async function confirmarPagoVenta(ventaId) {
  const { ok } = await apiRequest(`/sales/${ventaId}/confirmar-pago`, { method: 'POST' })
  return ok
}

export async function updateVenta(ventaId, payload) {
  const { item } = await apiRequest(`/sales/${ventaId}`, {
    method: 'PATCH',
    body: payload,
  })
  return item
}

export async function deleteVenta(ventaId) {
  const { ok } = await apiRequest(`/sales/${ventaId}`, { method: 'DELETE' })
  return ok
}

export async function clearHistorialVentas() {
  await apiRequest('/sales/historial', { method: 'DELETE' })
  return true
}
