import { apiRequest } from '../api/client'

export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
]

export function formatDiasSemana(dias) {
  if (!dias?.length) return 'Sin día programado'
  const label = DIAS_SEMANA.find((d) => d.value === dias[0])?.label
  return label ? `Cada ${label.toLowerCase()}` : 'Sin día programado'
}

export function comboTieneAlarmas(combo) {
  return Boolean(combo?.cronograma?.activo && combo.cronograma?.diasSemana?.length)
}

export function cronogramaEstadoLabel(combo) {
  if (!comboTieneAlarmas(combo)) return 'Solo consulta — sin alarmas'
  return formatDiasSemana(combo.cronograma.diasSemana)
}

export function getDiaSemanaLabel(value) {
  return DIAS_SEMANA.find((d) => d.value === Number(value))?.label ?? ''
}

export function getDiaSemanaAnteriorLabel(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return getDiaSemanaLabel((n + 6) % 7)
}

/** Texto de alarmas según el día de riego elegido (0=Dom … 6=Sáb). */
export function textoAlarmasCronograma(diaRiego) {
  if (diaRiego == null) {
    return 'Sin día: el combo queda solo para consulta y edición. Elige un día cuando quieras activar alarmas y recordatorios.'
  }
  const dia = getDiaSemanaLabel(diaRiego)
  const anterior = getDiaSemanaAnteriorLabel(diaRiego)
  return `Con ${dia} programado: el ${anterior} a las 10:00 aviso de qué regar; el ${dia} a las 20:00 confirmar si se hizo.`
}

export function offsetIsoDate(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const ny = date.getFullYear()
  const nm = String(date.getMonth() + 1).padStart(2, '0')
  const nd = String(date.getDate()).padStart(2, '0')
  return `${ny}-${nm}-${nd}`
}

export async function getComboCategorias() {
  const { items } = await apiRequest('/bitacora/combo-categorias')
  return items
}

export async function createComboCategoria(nombre) {
  const { item } = await apiRequest('/bitacora/combo-categorias', {
    method: 'POST',
    body: { nombre },
  })
  return item
}

export async function deleteComboCategoria(id) {
  const { ok } = await apiRequest(`/bitacora/combo-categorias/${id}`, { method: 'DELETE' })
  return ok
}

export async function getCombos() {
  const { items } = await apiRequest('/bitacora/combos')
  return items
}

export async function getTareasHoy(fecha) {
  const q = fecha ? `?fecha=${encodeURIComponent(fecha)}` : ''
  return apiRequest(`/bitacora/tareas/hoy${q}`)
}

export async function getTareasPendientesConfirmacion(hasta) {
  const q = hasta ? `?hasta=${encodeURIComponent(hasta)}` : ''
  const { items } = await apiRequest(`/bitacora/tareas/pendientes${q}`)
  return items
}

export async function createCombo(payload) {
  const { item } = await apiRequest('/bitacora/combos', { method: 'POST', body: payload })
  return item
}

export async function updateCombo(id, payload) {
  const { item } = await apiRequest(`/bitacora/combos/${id}`, { method: 'PATCH', body: payload })
  return item
}

export async function deleteCombo(id) {
  const { ok } = await apiRequest(`/bitacora/combos/${id}`, { method: 'DELETE' })
  return ok
}

export async function saveCronograma(comboId, diasSemana) {
  const { item } = await apiRequest(`/bitacora/combos/${comboId}/cronograma`, {
    method: 'PUT',
    body: { diasSemana },
  })
  return item
}

export async function marcarComboCompletado(comboId, fecha) {
  return apiRequest(`/bitacora/combos/${comboId}/completar`, {
    method: 'POST',
    body: { fecha },
  })
}
