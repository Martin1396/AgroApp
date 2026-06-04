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
  try {
    await apiRequest('/productions', { method: 'GET' })
  } catch {
    /* use dedicated create validation on server */
  }
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

export async function updateCorte(productionId, corteId, { cantidad, fecha }) {
  const { ok } = await apiRequest(`/productions/${productionId}/cortes/${corteId}`, {
    method: 'PATCH',
    body: { cantidad, fecha },
  })
  return ok
}

export async function addCorte(productionId, cantidad) {
  const { corte } = await apiRequest(`/productions/${productionId}/cortes`, {
    method: 'POST',
    body: { cantidad },
  })
  return corte
}

export function getTotalCortes(cortes) {
  return cortes.reduce((sum, c) => sum + Number(c.cantidad || 0), 0)
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
