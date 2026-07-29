/**
 * Interpreta texto estructurado (Programa, Descripción general, Rondas, Productos)
 * y lo convierte en estructura de combo.
 */

const RONDA_HEADER =
  /^(?:ronda|semana|combo|aplicaci[oó]n)\s*(\d+)\s*[:.\-–—]?\s*(.*)?$/i

const PRODUCTO_HEADER = /^producto\s*(\d+)\s*[:.\-–—]?\s*(.*)?$/i

const SECTION_PROGRAMA = /^programa\s*$/i
const SECTION_PROGRAMA_INLINE = /^programa\s*[:.\-–—]\s*(.+)$/i
const SECTION_DESC = /^descripci[oó]n\s*general\s*$/i
const SECTION_DESC_INLINE = /^descripci[oó]n\s*general\s*[:.\-–—]\s*(.+)$/i

const FIELD_NOMBRE = /^nombre(?:\s+del\s+producto)?\s*[:.\-–—]\s*(.+)$/i
const FIELD_TIPO = /^tipo\s*[:.\-–—]\s*(.+)$/i
const FIELD_PROPOSITO = /^prop[oó]sito\s*[:.\-–—]\s*(.+)$/i
const FIELD_DESCRIPCION = /^descripci[oó]n\s*[:.\-–—]\s*(.+)$/i
const FIELD_DOSIS = /^dosis(?:\s*\(opcional\))?\s*[:.\-–—]\s*(.+)$/i

const META_PROGRAMA = /^(?:programa|nombre(?:\s+del\s+programa)?)\s*[:.\-–—]\s*(.+)$/i
const META_DESCRIPCION = /^(?:descripci[oó]n\s*general|notas?|observaciones?)\s*[:.\-–—]\s*(.+)$/i

const DOSIS_RE =
  /(\d+[\d.,]*\s*(?:ml|g|gr|kg|cc|lt|l|litros?|gramos?|mililitros?|mg)(?:\s*\/\s*(?:l|litro|litros|100\s*l|100l))?)/i

const PROPOSITO_INLINE = /\b(?:para|—|–|-)\s*(.+)$/i

function cleanLine(line) {
  return line
    .replace(/^[\s•\-–—*]+/, '')
    .replace(/^\d+[\).\]]\s*/, '')
    .trim()
}

function isInstructionFooter(line) {
  const l = line.toLowerCase()
  return (
    l.startsWith('este formato')
    || l.startsWith('y luego crear')
    || l.startsWith('así toda la información')
    || l.includes('ideal para la aplicación')
  )
}

function emptyRonda(n, extra = '') {
  const base = `Ronda ${n}`
  return { nombre: extra?.trim() ? `${base} — ${extra.trim()}` : base, productos: [] }
}

function emptyProducto() {
  return { nombre: '', tipo: '', proposito: '', descripcionProd: '', dosis: '' }
}

function finalizeProducto(raw) {
  if (!raw?.nombre?.trim()) return null
  const parts = []
  if (raw.tipo?.trim()) parts.push(`Tipo: ${raw.tipo.trim()}`)
  if (raw.proposito?.trim()) parts.push(`Propósito: ${raw.proposito.trim()}`)
  if (raw.descripcionProd?.trim()) parts.push(raw.descripcionProd.trim())
  return {
    nombre: raw.nombre.trim(),
    proposito: parts.join('\n'),
    dosis: raw.dosis?.trim() ?? '',
  }
}

function parseProductoLine(line) {
  const raw = cleanLine(line)
  if (!raw) return null

  let dosis = ''
  let rest = raw
  const dMatch = raw.match(DOSIS_RE)
  if (dMatch) {
    dosis = dMatch[1].trim()
    rest = `${raw.slice(0, dMatch.index).trim()} ${raw.slice(dMatch.index + dMatch[0].length).trim()}`.trim()
  }

  let proposito = ''
  const pMatch = rest.match(PROPOSITO_INLINE)
  if (pMatch) {
    proposito = pMatch[1].trim()
    rest = rest.slice(0, pMatch.index).trim()
  }

  const nombre = rest.replace(/[,;]\s*$/, '').trim()
  if (!nombre) return null

  return { nombre, proposito, dosis }
}

function tryFieldLine(line, producto) {
  const n = line.match(FIELD_NOMBRE)
  if (n) {
    producto.nombre = n[1].trim()
    return { kind: 'field', multiline: null }
  }

  const t = line.match(FIELD_TIPO)
  if (t) {
    producto.tipo = t[1].trim()
    return { kind: 'field', multiline: null }
  }

  const p = line.match(FIELD_PROPOSITO)
  if (p) {
    producto.proposito = p[1].trim()
    return { kind: 'field', multiline: 'proposito' }
  }

  const d = line.match(FIELD_DESCRIPCION)
  if (d) {
    producto.descripcionProd = d[1].trim()
    return { kind: 'field', multiline: 'descripcionProd' }
  }

  const dos = line.match(FIELD_DOSIS)
  if (dos) {
    producto.dosis = dos[1].trim()
    return { kind: 'field', multiline: null }
  }

  return null
}

export function parseComboText(text) {
  const rawLines = String(text ?? '').split(/\r?\n/)
  const lines = rawLines.map((l) => l.trim())

  if (!lines.some(Boolean)) {
    return { ok: false, error: 'No hay texto para interpretar' }
  }

  let mode = 'idle'
  let nombre = ''
  let descripcion = ''
  const descParts = []
  const programaParts = []
  const rondas = []
  let currentRonda = null
  let currentProducto = null
  let multilineField = null

  const pushProducto = () => {
    if (!currentRonda || !currentProducto) return
    const p = finalizeProducto(currentProducto)
    if (p) currentRonda.productos.push(p)
    currentProducto = null
    multilineField = null
  }

  const pushRonda = (num, extra = '') => {
    pushProducto()
    currentRonda = emptyRonda(num, extra)
    rondas.push(currentRonda)
    mode = 'ronda'
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) {
      if (mode === 'descripcion' && descParts.length) descParts.push('')
      if (multilineField && currentProducto) {
        currentProducto[multilineField] += '\n'
      }
      continue
    }

    if (isInstructionFooter(line)) break

    const secProg = line.match(SECTION_PROGRAMA)
    if (secProg) {
      pushProducto()
      mode = 'programa'
      continue
    }

    const secProgInline = line.match(SECTION_PROGRAMA_INLINE)
    if (secProgInline) {
      pushProducto()
      nombre = secProgInline[1].trim()
      mode = 'idle'
      continue
    }

    const secDesc = line.match(SECTION_DESC)
    if (secDesc) {
      pushProducto()
      mode = 'descripcion'
      continue
    }

    const secDescInline = line.match(SECTION_DESC_INLINE)
    if (secDescInline) {
      pushProducto()
      mode = 'descripcion'
      if (secDescInline[1]?.trim()) descParts.push(secDescInline[1].trim())
      continue
    }

    const rondaMatch = line.match(RONDA_HEADER)
    if (rondaMatch) {
      pushRonda(Number(rondaMatch[1]), rondaMatch[2]?.trim() || '')
      continue
    }

    const prodHeader = line.match(PRODUCTO_HEADER)
    if (prodHeader) {
      pushProducto()
      if (!currentRonda) pushRonda(1)
      currentProducto = emptyProducto()
      mode = 'producto'
      multilineField = null
      continue
    }

    if (mode === 'producto' && currentProducto) {
      const fieldHit = tryFieldLine(line, currentProducto)
      if (fieldHit) {
        multilineField = fieldHit.multiline
        continue
      }

      if (multilineField && !/^(?:nombre|tipo|prop[oó]sito|descripci[oó]n|dosis)\s*[:.\-–—]/i.test(line)) {
        const prev = currentProducto[multilineField] || ''
        currentProducto[multilineField] = prev ? `${prev}\n${line}` : line
        continue
      }
    }

    const metaProg = line.match(META_PROGRAMA)
    if (metaProg) {
      nombre = metaProg[1].trim()
      mode = 'idle'
      continue
    }

    const metaDesc = line.match(META_DESCRIPCION)
    if (metaDesc) {
      descripcion = metaDesc[1].trim()
      mode = 'idle'
      continue
    }

    if (mode === 'programa') {
      if (!/^descripci[oó]n/i.test(line)) programaParts.push(line)
      continue
    }

    if (mode === 'descripcion') {
      if (
        !/^ronda\s*\d/i.test(line)
        && !/^producto\s*\d/i.test(line)
        && !SECTION_PROGRAMA.test(line)
        && !SECTION_DESC.test(line)
      ) {
        descParts.push(line)
      }
      continue
    }

    if (currentRonda && mode === 'ronda') {
      const inline = parseProductoLine(line)
      if (inline) {
        currentProducto = {
          nombre: inline.nombre,
          tipo: '',
          proposito: inline.proposito,
          descripcionProd: '',
          dosis: inline.dosis,
        }
        pushProducto()
        mode = 'producto'
        continue
      }
    }

    if (!currentRonda && mode === 'idle' && !nombre) {
      nombre = line
      continue
    }

    if (!currentRonda && mode === 'idle' && nombre && !descripcion && !descParts.length) {
      descParts.push(line)
      mode = 'descripcion'
    }
  }

  pushProducto()

  if (!nombre && programaParts.length) {
    nombre = programaParts.join(' ').trim()
  }

  if (!descripcion && descParts.length) {
    descripcion = descParts
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const rondasValidas = rondas.filter((r) => r.productos.length > 0)

  if (!rondasValidas.length) {
    return {
      ok: false,
      error: 'No se detectaron productos. Usa bloques «Producto 1» con «Nombre del producto: …» o líneas simples bajo «Ronda 1».',
    }
  }

  return {
    ok: true,
    nombre,
    descripcion,
    rondas: rondasValidas.map((r, i) => ({
      nombre: r.nombre || `Ronda ${i + 1}`,
      productos: r.productos,
    })),
  }
}

export const COMBO_TEXTO_EJEMPLO = `Programa
Riego semanal – Control preventivo de hongos e insectos

Descripción general
Programa de riego preventivo diseñado para mantener la sanidad del cultivo…

Ronda 1

Producto 1
Nombre del producto: Amistar
Tipo: Fungicida sistémico
Propósito: Control de enfermedades causadas por hongos
Descripción: Fungicida de acción preventiva y curativa…
Dosis (opcional): Según recomendación técnica para 200 L

Producto 2
Nombre del producto: Elosal
Tipo: Fungicida
Propósito: Complementar el control de enfermedades
Descripción: Producto para reforzar el manejo de hongos…
Dosis (opcional): Según recomendación técnica para 200 L`
