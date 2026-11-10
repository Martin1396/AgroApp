import { apiRequest } from '../api/client'

export async function getProductions() {
  const { items } = await apiRequest('/productions')
  return items
}

export async function getActiveProductions() {
  const { items } = await apiRequest('/productions/active')
  return items
}

export async function getHistorialProductions() {
  const { items } = await apiRequest('/productions/historial')
  return items
}

export function formatProductionCode(sequence) {
  return String(sequence).padStart(5, '0')
}

export function camasRangesOverlap(desdeA, hastaA, desdeB, hastaB) {
  const a = Math.min(Number(desdeA), Number(hastaA))
  const b = Math.max(Number(desdeA), Number(hastaA))
  const c = Math.min(Number(desdeB), Number(hastaB))
  const d = Math.max(Number(desdeB), Number(hastaB))
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(d)) {
    return false
  }
  return a <= d && c <= b
}

export async function findActiveCamasConflict(desdeCama, hastaCama) {
  const active = await getActiveProductions()
  for (const p of active) {
    if (camasRangesOverlap(desdeCama, hastaCama, p.desdeCama, p.hastaCama)) {
      return p
    }
  }
  return null
}

export async function addProduction({ desdeCama, hastaCama, cantidadPlantas }) {
  const { item } = await apiRequest('/productions', {
    method: 'POST',
    body: { desdeCama, hastaCama, cantidadPlantas },
  })
  return item
}

export async function updateCorte(productionId, corteId, { cantidad, tallosDesechados, fecha }) {
  const { ok } = await apiRequest(`/productions/${productionId}/cortes/${corteId}`, {
    method: 'PATCH',
    body: { cantidad, tallosDesechados, fecha },
  })
  return ok
}

export async function addCorte(productionId, cantidad, tallosDesechados = 0, cama = null) {
  const { corte } = await apiRequest(`/productions/${productionId}/cortes`, {
    method: 'POST',
    body: { cantidad, tallosDesechados, cama },
  })
  return corte
}

export function listCamas(desdeCama, hastaCama) {
  const a = Number(desdeCama)
  const b = Number(hastaCama)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return []
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  const out = []
  for (let i = start; i <= end; i += 1) out.push(i)
  return out
}

export function daysSince(iso) {
  if (!iso) return 0
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return 0
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const now = new Date()
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((nowUtc - startUtc) / 86400000))
}

export function formatFechaCorta(iso) {
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

export function getCortesDeCama(cortes, cama) {
  return (cortes ?? []).filter((c) => Number(c.cama) === Number(cama))
}

export function getCortesSinCama(cortes) {
  return (cortes ?? []).filter((c) => c.cama == null || c.cama === '')
}

export function getTotalCortes(cortes) {
  return cortes.reduce((sum, c) => sum + Number(c.cantidad || 0), 0)
}

export function getTotalTallosDesechados(cortes) {
  return cortes.reduce((sum, c) => sum + Number(c.tallosDesechados || 0), 0)
}

export async function finalizarProduccion(productionId) {
  const { ok } = await apiRequest(`/productions/${productionId}/finalizar`, { method: 'POST' })
  return ok
}

export async function deleteProduction(productionId) {
  const { ok } = await apiRequest(`/productions/${productionId}`, { method: 'DELETE' })
  return ok
}

export async function clearHistorialProductions() {
  await apiRequest('/productions/historial', { method: 'DELETE' })
  return true
}

export function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}
