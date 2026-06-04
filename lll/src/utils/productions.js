const PRODUCTIONS_KEY = 'turpial_producciones'

function normalizeProduction(p) {
  return {
    ...p,
    cortes: Array.isArray(p.cortes) ? p.cortes : [],
    finalizada: Boolean(p.finalizada),
    fechaFinalizacion: p.fechaFinalizacion ?? null,
  }
}

export function getProductions() {
  try {
    const data = localStorage.getItem(PRODUCTIONS_KEY)
    const list = data ? JSON.parse(data) : []
    return list.map(normalizeProduction)
  } catch {
    return []
  }
}

export function getActiveProductions() {
  return getProductions().filter((p) => !p.finalizada)
}

export function getHistorialProductions() {
  return getProductions()
    .filter((p) => p.finalizada)
    .sort((a, b) => new Date(b.fechaFinalizacion) - new Date(a.fechaFinalizacion))
}

export function saveProductions(list) {
  localStorage.setItem(PRODUCTIONS_KEY, JSON.stringify(list))
}

export function formatProductionCode(sequence) {
  return String(sequence).padStart(5, '0')
}

export function getNextProductionSequence() {
  const list = getProductions()
  if (list.length === 0) return 1
  return Math.max(...list.map((p) => p.sequence)) + 1
}

/** Dos rangos inclusivos [desde, hasta] se solapan si comparten al menos una cama */
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

/** Busca producción activa que use alguna cama del rango propuesto */
export function findActiveCamasConflict(desdeCama, hastaCama) {
  const active = getActiveProductions()
  for (const p of active) {
    if (camasRangesOverlap(desdeCama, hastaCama, p.desdeCama, p.hastaCama)) {
      return p
    }
  }
  return null
}

export function addProduction({ desdeCama, hastaCama, cantidadPlantas }) {
  const sequence = getNextProductionSequence()
  const entry = {
    id: crypto.randomUUID?.() ?? `prod-${Date.now()}`,
    sequence,
    code: formatProductionCode(sequence),
    desdeCama,
    hastaCama,
    cantidadPlantas: cantidadPlantas ?? null,
    cortes: [],
    finalizada: false,
    createdAt: new Date().toISOString(),
    fechaFinalizacion: null,
  }
  const list = getProductions()
  list.unshift(entry)
  saveProductions(list)
  return entry
}

export function updateCorte(productionId, corteId, { cantidad, fecha }) {
  const list = getProductions()
  const index = list.findIndex((p) => p.id === productionId)
  if (index < 0) return false

  const cortes = list[index].cortes.map((c) =>
    c.id === corteId
      ? {
          ...c,
          cantidad: Number(cantidad),
          fecha: fecha || c.fecha,
        }
      : c,
  )

  list[index] = { ...list[index], cortes }
  saveProductions(list)
  return true
}

export function addCorte(productionId, cantidad) {
  const list = getProductions()
  const index = list.findIndex((p) => p.id === productionId)
  if (index < 0) return null

  const cortes = list[index].cortes
  const corte = {
    id: crypto.randomUUID?.() ?? `corte-${Date.now()}`,
    sequence: cortes.length + 1,
    cantidad,
    fecha: new Date().toISOString(),
  }

  list[index] = {
    ...list[index],
    cortes: [...cortes, corte],
  }
  saveProductions(list)
  return corte
}

export function getTotalCortes(cortes) {
  return cortes.reduce((sum, c) => sum + Number(c.cantidad || 0), 0)
}

export function finalizarProduccion(productionId) {
  const list = getProductions()
  const index = list.findIndex((p) => p.id === productionId)
  if (index < 0) return false
  list[index] = {
    ...list[index],
    finalizada: true,
    fechaFinalizacion: new Date().toISOString(),
  }
  saveProductions(list)
  return true
}

export function deleteProduction(productionId) {
  const list = getProductions().filter((p) => p.id !== productionId)
  saveProductions(list)
  return true
}

export function clearHistorialProductions() {
  const list = getProductions().filter((p) => !p.finalizada)
  saveProductions(list)
  return true
}

export function clearAllProductions() {
  saveProductions([])
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
