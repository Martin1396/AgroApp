export function rondaEtiqueta(ronda, index) {
  const num = `Ronda ${index + 1}`
  const custom = ronda.nombre?.trim()
  if (!custom || custom === num || custom.toLowerCase() === num.toLowerCase()) return num
  return num
}

export function rondaSubtitulo(ronda, index) {
  const num = `Ronda ${index + 1}`
  const custom = ronda.nombre?.trim()
  if (custom && custom !== num && custom.toLowerCase() !== num.toLowerCase()) return custom
  return null
}

const DOSIS_CORTA_RE =
  /^(\d+[\d.,]*\s*(?:ml|g|gr|kg|cc|lt|l|mg|mililitros?|gramos?|litros?)(?:\s*\/\s*(?:l|litro|litros|100\s*l|100l))?)/i

const DOSIS_PENDIENTE_RE =
  /seg[uú]n|recomendaci[oó]n|t[eé]cnica|consultar|variable|aplicar|caneca|pendiente|ver\s+etiqueta|fabricante/i

const DOSIS_VACIA_RE = /^(?:sin\s+dosis|no\s+aplica|n\/?a|—|-)$/i

const MAX_DOSIS_VISIBLE = 26

/** Texto corto para la etiqueta de dosis en tarjetas de combo. */
export function formatDosisDisplay(dosis) {
  const raw = String(dosis ?? '').trim()
  if (!raw) return null

  if (DOSIS_VACIA_RE.test(raw)) {
    return { label: 'Sin dosis', title: raw, variant: 'sin-dosis', full: raw }
  }

  const corta = DOSIS_CORTA_RE.exec(raw)
  if (corta && raw.length <= MAX_DOSIS_VISIBLE) {
    return { label: corta[1].trim(), title: raw, variant: 'dosis', full: raw }
  }

  if (raw.length <= MAX_DOSIS_VISIBLE && !DOSIS_PENDIENTE_RE.test(raw)) {
    return { label: raw, title: raw, variant: 'dosis', full: raw }
  }

  return { label: 'Pendiente', title: raw, variant: 'pendiente', full: raw }
}
