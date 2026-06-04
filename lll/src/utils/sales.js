const SALES_KEY = 'turpial_ventas'
const MAX_PDF_BYTES = 1_500_000

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
  const formatted = n.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: moneda === MONEDA.USD ? 2 : 0,
  })
  if (moneda === MONEDA.USD) return `USD ${formatted}`
  return `${formatted} COP`
}

function normalizeVariedad(v) {
  return {
    ...v,
    precioPorUnidad: Number(v.precioPorUnidad) || 0,
    tallos: Number(v.tallos) || 0,
  }
}

function normalizeSale(s) {
  const tipoFlor =
    s.tipoFlor === TIPO_FLOR.EXPORTACION || s.tipoFlor === TIPO_FLOR.NACIONAL ? s.tipoFlor : null
  return {
    ...s,
    tipoFlor,
    moneda: normalizeMoneda(s.moneda),
    variedades: Array.isArray(s.variedades) ? s.variedades.map(normalizeVariedad) : [],
    pagoConfirmado: Boolean(s.pagoConfirmado),
    comprobantePago: s.comprobantePago ?? null,
    comprobanteNombre: s.comprobanteNombre ?? '',
  }
}

export function computeVariedadSubtotal(v) {
  const pu = Number(v.precioPorUnidad) || 0
  const tallos = Number(v.tallos) || 0
  return pu * tallos
}

export function computeVentaTotal(variedades) {
  return (variedades ?? []).reduce((sum, v) => sum + computeVariedadSubtotal(v), 0)
}

export function getSales() {
  try {
    const data = localStorage.getItem(SALES_KEY)
    const list = data ? JSON.parse(data) : []
    return list.map(normalizeSale)
  } catch {
    return []
  }
}

export function saveSales(list) {
  localStorage.setItem(SALES_KEY, JSON.stringify(list))
}

export function getNextSaleSequence() {
  const list = getSales()
  if (list.length === 0) return 1
  return Math.max(...list.map((s) => s.sequence)) + 1
}

export function getActiveVentas() {
  return getSales()
    .filter((s) => !s.pagoConfirmado)
    .sort((a, b) => b.sequence - a.sequence)
}

export function getHistorialVentas() {
  return getSales()
    .filter((s) => s.pagoConfirmado)
    .sort((a, b) => new Date(b.fechaPagoConfirmado) - new Date(a.fechaPagoConfirmado))
}

export function getReporteVentasTotales() {
  const historial = getHistorialVentas()
  let totalCop = 0
  let totalUsd = 0
  let ventasCop = 0
  let ventasUsd = 0

  historial.forEach((s) => {
    const monto = Number(s.precioVenta) || 0
    if (s.moneda === MONEDA.USD) {
      totalUsd += monto
      ventasUsd += 1
    } else {
      totalCop += monto
      ventasCop += 1
    }
  })

  return {
    cantidadVentas: historial.length,
    totalCop,
    totalUsd,
    ventasCop,
    ventasUsd,
  }
}

export function addVenta({
  cliente,
  tipoFlor,
  moneda,
  variedades,
  precioVenta,
  productionId,
  productionLabel,
}) {
  const sequence = getNextSaleSequence()
  const entry = {
    id: crypto.randomUUID?.() ?? `venta-${Date.now()}`,
    sequence,
    cliente: cliente.trim(),
    tipoFlor,
    moneda: normalizeMoneda(moneda),
    variedades,
    precioVenta: Number(precioVenta),
    productionId,
    productionLabel,
    comprobantePago: null,
    comprobanteNombre: '',
    pagoConfirmado: false,
    createdAt: new Date().toISOString(),
    fechaPagoConfirmado: null,
  }
  const list = getSales()
  list.unshift(entry)
  saveSales(list)
  return entry
}

export function attachComprobante(ventaId, dataUrl, fileName) {
  const list = getSales()
  const index = list.findIndex((s) => s.id === ventaId)
  if (index < 0) return false
  list[index] = {
    ...list[index],
    comprobantePago: dataUrl,
    comprobanteNombre: fileName,
  }
  saveSales(list)
  return true
}

export function confirmarPagoVenta(ventaId) {
  const list = getSales()
  const index = list.findIndex((s) => s.id === ventaId)
  if (index < 0) return false
  list[index] = {
    ...list[index],
    pagoConfirmado: true,
    fechaPagoConfirmado: new Date().toISOString(),
  }
  saveSales(list)
  return true
}

export function updateVenta(ventaId, {
  cliente,
  tipoFlor,
  moneda,
  variedades,
  precioVenta,
  productionId,
  productionLabel,
}) {
  const list = getSales()
  const index = list.findIndex((s) => s.id === ventaId)
  if (index < 0) return false
  list[index] = {
    ...list[index],
    cliente: cliente.trim(),
    tipoFlor,
    moneda: normalizeMoneda(moneda),
    variedades,
    precioVenta: Number(precioVenta),
    productionId,
    productionLabel,
  }
  saveSales(list)
  return true
}

export function deleteVenta(ventaId) {
  const list = getSales()
  const next = list.filter((s) => s.id !== ventaId)
  if (next.length === list.length) return false
  saveSales(next)
  return true
}

export function clearHistorialVentas() {
  const list = getSales().filter((s) => !s.pagoConfirmado)
  saveSales(list)
  return true
}

export function clearAllVentas() {
  saveSales([])
  return true
}

export { MAX_PDF_BYTES }
