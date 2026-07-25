import { apiRequest } from '../api/client'

export const TIPO_LABOR = {
  FUMIGACION: 'fumigacion',
  FERTILIZACION: 'fertilizacion',
  ABONO: 'abono',
  CONTROL_ENFERMEDADES: 'control_enfermedades',
  PODA: 'poda',
}

export const TIPO_LABOR_LABELS = {
  [TIPO_LABOR.FUMIGACION]: 'Fumigación',
  [TIPO_LABOR.FERTILIZACION]: 'Fertilización',
  [TIPO_LABOR.ABONO]: 'Abono',
  [TIPO_LABOR.CONTROL_ENFERMEDADES]: 'Control de enfermedades',
  [TIPO_LABOR.PODA]: 'Poda',
}

export const TIPO_LABOR_ORDER = [
  TIPO_LABOR.FUMIGACION,
  TIPO_LABOR.FERTILIZACION,
  TIPO_LABOR.ABONO,
  TIPO_LABOR.CONTROL_ENFERMEDADES,
  TIPO_LABOR.PODA,
]

export function getTipoLaborLabel(tipo) {
  return TIPO_LABOR_LABELS[tipo] ?? tipo ?? 'Labor'
}

export function formatFechaBitacora(isoDate) {
  if (!isoDate) return '—'
  try {
    const [y, m, d] = String(isoDate).slice(0, 10).split('-').map(Number)
    if (!y || !m || !d) return isoDate
    return new Date(y, m - 1, d).toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export function todayIsoDate() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatProductionCamasLabel(production) {
  if (!production) return ''
  return `Producción ${production.code} — camas ${production.desdeCama} a ${production.hastaCama}`
}

/** Guarda en BD las producciones activas elegidas (JSON en columna ubicacion). */
export function serializeCamasSelection(productions) {
  const payload = productions.map((p) => ({
    id: p.id,
    code: p.code,
    desdeCama: p.desdeCama,
    hastaCama: p.hastaCama,
  }))
  return JSON.stringify(payload)
}

export function parseCamasUbicacion(ubicacion) {
  if (!ubicacion?.trim()) return []
  try {
    const parsed = JSON.parse(ubicacion)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => p && p.id)
  } catch {
    return []
  }
}

export function formatCamasDisplay(ubicacion) {
  const parsed = parseCamasUbicacion(ubicacion)
  if (parsed.length) {
    return parsed
      .map((p) => `Producción ${p.code} — camas ${p.desdeCama} a ${p.hastaCama}`)
      .join(' · ')
  }
  return ubicacion?.trim() || ''
}

export async function getBitacoraRegistros() {
  const { items } = await apiRequest('/bitacora')
  return items
}

export async function addBitacoraRegistro(payload) {
  const { item } = await apiRequest('/bitacora', { method: 'POST', body: payload })
  return item
}

export async function updateBitacoraRegistro(id, payload) {
  const { item } = await apiRequest(`/bitacora/${id}`, { method: 'PATCH', body: payload })
  return item
}

export async function deleteBitacoraRegistro(id) {
  const { ok } = await apiRequest(`/bitacora/${id}`, { method: 'DELETE' })
  return ok
}
