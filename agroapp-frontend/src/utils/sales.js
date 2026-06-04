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
  const formatted = n.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: moneda === MONEDA.USD ? 2 : 0,
  })
  if (moneda === MONEDA.USD) return `USD ${formatted}`
  return `${formatted} COP`
}

export function computeVariedadSubtotal(v) {
  const pu = Number(v.precioPorUnidad) || 0
  const tallos = Number(v.tallos) || 0
  return pu * tallos
}

export function computeVentaTotal(variedades) {
  return (variedades ?? []).reduce((sum, v) => sum + computeVariedadSubtotal(v), 0)
}

export const MAX_PDF_BYTES = 1_500_000

export async function getSales() {
  const { items } = await apiRequest('/sales')
  return items
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
