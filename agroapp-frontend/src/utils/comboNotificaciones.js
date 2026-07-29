import { formatDosisDisplay } from './comboDisplay'

function dosisCorta(dosis) {
  const fmt = formatDosisDisplay(dosis)
  if (!fmt) return 'Sin dosis'
  return fmt.label
}

function etiquetaRonda(tarea) {
  const num = (tarea.rondaIndice ?? 0) + 1
  const total = tarea.rondaTotal ?? 1
  const nombre = tarea.rondaNombre?.trim()
  if (nombre && !/^ronda\s+\d+$/i.test(nombre)) {
    return `${nombre} (${num}/${total})`
  }
  return `Ronda ${num}${total > 1 ? ` (${num}/${total})` : ''}`
}

function lineasProductos(productos) {
  if (!productos?.length) return ['(Sin productos)']
  return productos.map((p) => `• ${p.nombre} — ${dosisCorta(p.dosis)}`)
}

/** Texto completo para cuerpo de notificación (una tarea). */
export function formatTareaNotificacion(tarea, tipo = 'hoy') {
  const encabezado =
    tipo === 'manana'
      ? 'Recuerda: mañana próximo riego'
      : tipo === 'noche'
        ? '¿Realizaste el riego de hoy?'
        : 'Riego programado hoy'

  const lineas = [
    encabezado,
    `${tarea.nombre}`,
    etiquetaRonda(tarea),
    ...lineasProductos(tarea.productos),
  ]
  return lineas.join('\n')
}

export function formatVariasTareasNotificacion(tareas, tipo = 'hoy') {
  if (!tareas?.length) return ''
  if (tareas.length === 1) return formatTareaNotificacion(tareas[0], tipo)
  return tareas.map((t) => formatTareaNotificacion(t, tipo)).join('\n\n—\n\n')
}

export function tituloNotificacion(tareas, tipo = 'hoy') {
  if (!tareas?.length) return 'AgroApp — Bitácora'
  if (tareas.length === 1) {
    const t = tareas[0]
    if (tipo === 'manana') return `Mañana: ${t.nombre} — ${etiquetaRonda(t)}`
    if (tipo === 'noche') return `¿Riego de hoy? ${t.nombre}`
    return `Hoy: ${t.nombre} — ${etiquetaRonda(t)}`
  }
  if (tipo === 'manana') return `Mañana: ${tareas.length} riegos programados`
  if (tipo === 'noche') return `¿Realizaste los ${tareas.length} riegos de hoy?`
  return `Hoy: ${tareas.length} riegos programados`
}

export function tareaDemoNotificacion(combo) {
  const activa = combo?.rondaActiva
  const ronda = activa ?? combo?.rondas?.[0]
  const productos = activa?.productos ?? ronda?.productos ?? [
    { id: 'demo-1', nombre: 'Producto ejemplo', dosis: '2 ml/L' },
  ]
  const indice = activa?.indice ?? 0
  return {
    comboId: combo?.id ?? 'demo',
    nombre: combo?.nombre ?? 'Combo de ejemplo',
    rondaIndice: indice,
    rondaTotal: activa?.total ?? combo?.rondas?.length ?? 1,
    rondaNombre: activa?.nombre ?? ronda?.nombre ?? 'Ronda 1',
    productos,
    fecha: new Date().toISOString().slice(0, 10),
    completado: false,
  }
}

async function asegurarPermisoNotificacion() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, error: 'Este navegador no soporta notificaciones.' }
  }
  if (Notification.permission === 'granted') return { ok: true }
  if (Notification.permission === 'denied') {
    return { ok: false, error: 'Notificaciones bloqueadas. Actívalas en ajustes del navegador.' }
  }
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') {
    return { ok: false, error: 'Permiso de notificación no concedido.' }
  }
  return { ok: true }
}

export async function enviarNotificacionCombo({ tareas, tipo = 'hoy', tag = 'bitacora_combo' }) {
  const perm = await asegurarPermisoNotificacion()
  if (!perm.ok) return perm

  const lista = tareas?.length ? tareas : []
  const titulo = tituloNotificacion(lista, tipo)
  const cuerpo =
    lista.length > 0
      ? formatVariasTareasNotificacion(lista, tipo)
      : 'Simulacro de alarma — configura un combo con cronograma para ver datos reales.'

  try {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/logo-turpial-sidebar.png',
      tag: `${tag}_${tipo}_${Date.now()}`,
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message || 'No se pudo mostrar la notificación.' }
  }
}

export async function simularNotificacionManana(tareasManana, comboFallback) {
  const tareas = tareasManana?.length ? tareasManana : [tareaDemoNotificacion(comboFallback)]
  return enviarNotificacionCombo({ tareas, tipo: 'manana', tag: 'bitacora_simulacro' })
}

/** Simula la confirmación de las 20:00 del día del riego. */
export async function simularNotificacionNoche(tareasHoy, comboFallback) {
  const tareas = tareasHoy?.length ? tareasHoy : [tareaDemoNotificacion(comboFallback)]
  return enviarNotificacionCombo({ tareas, tipo: 'noche', tag: 'bitacora_simulacro' })
}
