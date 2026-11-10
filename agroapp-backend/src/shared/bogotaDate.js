const TZ = 'America/Bogota'

function pad(n) {
  return String(n).padStart(2, '0')
}

export function bogotaNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  }
}

export function bogotaDateToUtc(year, month, day, hour = 0, minute = 0, second = 0) {
  const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}-05:00`
  return new Date(iso)
}

export function lastCloseableYearMonth(now = bogotaNowParts()) {
  if (now.day >= 28) return { anio: now.year, mes: now.month }
  if (now.month === 1) return { anio: now.year - 1, mes: 12 }
  return { anio: now.year, mes: now.month - 1 }
}

export function nextYearMonth(ym) {
  if (ym.mes === 12) return { anio: ym.anio + 1, mes: 1 }
  return { anio: ym.anio, mes: ym.mes + 1 }
}

export function ymValue(ym) {
  return ym.anio * 12 + ym.mes
}

export function periodEndForMonth(anio, mes) {
  return bogotaDateToUtc(anio, mes, 28, 23, 59, 59)
}

export function formatYearMonthLabel(anio, mes) {
  const d = new Date(Date.UTC(anio, mes - 1, 1))
  const label = d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
