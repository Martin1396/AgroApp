import { useEffect } from 'react'
import {
  enviarNotificacionCombo,
  tituloNotificacion,
  formatVariasTareasNotificacion,
} from '../utils/comboNotificaciones'

const ALARMA_HORA_MANANA = 10
const ALARMA_HORA_NOCHE = 20

function alarmaKey(tipo, fecha) {
  return `bitacora_alarma_${tipo}_${fecha}`
}

function yaNotificado(tipo, fecha) {
  return localStorage.getItem(alarmaKey(tipo, fecha)) === '1'
}

function marcarNotificado(tipo, fecha) {
  localStorage.setItem(alarmaKey(tipo, fecha), '1')
}

function pedirPermisoNotificaciones() {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

function mostrarNotificacion(titulo, cuerpo, tag) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(titulo, {
      body: cuerpo,
      icon: '/logo-turpial-sidebar.png',
      tag,
    })
  } catch {
    /* ignore */
  }
}

function esHoraAlarma(hora) {
  const now = new Date()
  return now.getHours() === hora && now.getMinutes() === 0
}

/** Alarmas: 10:00 día anterior (próximo riego) y 20:00 día del riego (confirmar si se hizo). */
export function useComboAlarmas({ tareasHoy, tareasManana, fechaHoy }) {
  useEffect(() => {
    pedirPermisoNotificaciones()

    const revisar = () => {
      const pendientesHoy = (tareasHoy ?? []).filter((t) => !t.completado)

      // Día anterior al riego (10:00): aviso con lo programado para mañana
      if (esHoraAlarma(ALARMA_HORA_MANANA)) {
        const manana = tareasManana ?? []
        if (manana.length && !yaNotificado('manana', fechaHoy)) {
          mostrarNotificacion(
            tituloNotificacion(manana, 'manana'),
            formatVariasTareasNotificacion(manana, 'manana'),
            alarmaKey('manana', fechaHoy),
          )
          marcarNotificado('manana', fechaHoy)
        }
      }

      // Día del riego elegido (20:00): confirmar si se hizo
      if (esHoraAlarma(ALARMA_HORA_NOCHE)) {
        if (pendientesHoy.length && !yaNotificado('noche', fechaHoy)) {
          mostrarNotificacion(
            tituloNotificacion(pendientesHoy, 'noche'),
            formatVariasTareasNotificacion(pendientesHoy, 'noche'),
            alarmaKey('noche', fechaHoy),
          )
          marcarNotificado('noche', fechaHoy)
        }
      }
    }

    revisar()
    const id = setInterval(revisar, 60_000)
    return () => clearInterval(id)
  }, [tareasHoy, tareasManana, fechaHoy])
}

export function solicitarPermisoAlarmas() {
  pedirPermisoNotificaciones()
}

export function estadoNotificaciones() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, label: 'Notificaciones no disponibles en este navegador' }
  }
  if (Notification.permission === 'granted') {
    return { ok: true, label: 'Notificaciones permitidas — recibirás los avisos' }
  }
  if (Notification.permission === 'denied') {
    return { ok: false, label: 'Notificaciones bloqueadas — actívalas en ajustes del navegador' }
  }
  return { ok: false, label: 'Acepta notificaciones cuando el navegador lo pida' }
}

export { enviarNotificacionCombo }
