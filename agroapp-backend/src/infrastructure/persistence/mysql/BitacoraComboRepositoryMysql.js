import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'

function auditName(user) {
  if (!user) return ''
  return [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.cedula || ''
}

function parseDiasSemana(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => n >= 0 && n <= 6)
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => n >= 0 && n <= 6) : []
  } catch {
    return []
  }
}

function normalizeCategoriaId(value) {
  const id = String(value ?? '').trim()
  return id || null
}

function comboSelectSql(alias = 'c') {
  return `
    SELECT ${alias}.*,
           cat.nombre AS categoria_nombre
    FROM bitacora_combos ${alias}
    LEFT JOIN bitacora_combo_categorias cat ON cat.id = ${alias}.categoria_id AND cat.activo = 1
  `
}

function normalizeRondasInput(data) {
  if (Array.isArray(data.rondas) && data.rondas.length) {
    return data.rondas.map((r, i) => ({
      nombre: String(r.nombre ?? '').trim() || `Ronda ${i + 1}`,
      productos: Array.isArray(r.productos) ? r.productos : [],
    }))
  }
  if (Array.isArray(data.productos) && data.productos.length) {
    return [{ nombre: 'Ronda 1', productos: data.productos }]
  }
  return [{ nombre: 'Ronda 1', productos: [] }]
}

async function loadRondas(comboIds) {
  if (!comboIds.length) return new Map()
  const placeholders = comboIds.map(() => '?').join(',')
  const rondaRows = await query(
    `SELECT * FROM bitacora_combo_rondas WHERE combo_id IN (${placeholders}) ORDER BY orden`,
    comboIds,
  )
  const rondaIds = rondaRows.map((r) => r.id)
  const prodMap = new Map()
  if (rondaIds.length) {
    const prodPlaceholders = rondaIds.map(() => '?').join(',')
    const prodRows = await query(
      `SELECT * FROM bitacora_combo_productos WHERE ronda_id IN (${prodPlaceholders}) ORDER BY orden`,
      rondaIds,
    )
    for (const row of prodRows) {
      const list = prodMap.get(row.ronda_id) || []
      list.push({
        id: row.id,
        nombre: row.nombre,
        proposito: row.proposito || '',
        dosis: row.dosis || '',
      })
      prodMap.set(row.ronda_id, list)
    }
  }

  const map = new Map()
  for (const row of rondaRows) {
    const list = map.get(row.combo_id) || []
    list.push({
      id: row.id,
      orden: row.orden,
      nombre: row.nombre || `Ronda ${row.orden}`,
      productos: prodMap.get(row.id) || [],
    })
    map.set(row.combo_id, list)
  }
  return map
}

async function loadCronogramas(comboIds) {
  if (!comboIds.length) return new Map()
  const placeholders = comboIds.map(() => '?').join(',')
  const rows = await query(
    `SELECT * FROM bitacora_combo_cronograma WHERE combo_id IN (${placeholders})`,
    comboIds,
  )
  const map = new Map()
  for (const row of rows) {
    map.set(row.combo_id, {
      id: row.id,
      diasSemana: parseDiasSemana(row.dias_semana),
      fechaInicio: row.fecha_inicio
        ? row.fecha_inicio instanceof Date
          ? toIsoDate(row.fecha_inicio)
          : String(row.fecha_inicio).slice(0, 10)
        : null,
      actualizadoEn: row.actualizado_en,
      activo: Boolean(row.activo),
    })
  }
  return map
}

function parseFechaIso(fechaIso) {
  const [y, m, d] = String(fechaIso).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function diaSemanaDe(fechaIso) {
  return parseFechaIso(fechaIso).getDay()
}

function countDiaSemanaEntre(fechaInicioIso, hastaIso, diaSemana) {
  const start = parseFechaIso(fechaInicioIso)
  const end = parseFechaIso(hastaIso)
  const cur = new Date(start)
  let count = 0
  while (cur <= end) {
    if (cur.getDay() === diaSemana) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function cronogramaDiaSemana(cronograma) {
  const dias = cronograma?.diasSemana
  if (!Array.isArray(dias) || !dias.length) return null
  return Number(dias[0])
}

function getRondaIndiceParaFecha(combo, fechaIso) {
  const cron = combo.cronograma
  const diaSemana = cronogramaDiaSemana(cron)
  if (!cron?.activo || diaSemana == null || diaSemanaDe(fechaIso) !== diaSemana) return null

  const rondas = combo.rondas || []
  if (!rondas.length) return null

  const fechaInicio =
    cron.fechaInicio ||
    (cron.actualizadoEn instanceof Date
      ? toIsoDate(cron.actualizadoEn)
      : String(cron.actualizadoEn || combo.createdAt || '').slice(0, 10))
  if (!fechaInicio) return 0

  const ocurrencias = countDiaSemanaEntre(fechaInicio, fechaIso, diaSemana)
  if (ocurrencias <= 0) return 0
  return (ocurrencias - 1) % rondas.length
}

function getRondaParaFecha(combo, fechaIso) {
  const idx = getRondaIndiceParaFecha(combo, fechaIso)
  if (idx == null) return null
  const rondas = combo.rondas || []
  if (!rondas.length) return null
  const ronda = rondas[idx]
  return {
    ronda,
    indice: idx,
    total: rondas.length,
    nombre: ronda.nombre || `Ronda ${idx + 1}`,
    productos: ronda.productos || [],
  }
}

function getProximaFechaProgramada(cronograma, desdeIso) {
  const diaSemana = cronogramaDiaSemana(cronograma)
  if (diaSemana == null) return null
  const cur = parseFechaIso(desdeIso)
  for (let i = 0; i < 8; i++) {
    if (cur.getDay() === diaSemana) return toIsoDate(cur)
    cur.setDate(cur.getDate() + 1)
  }
  return null
}

function getRondaActiva(combo, referenciaIso) {
  const rondas = combo.rondas || []
  if (!rondas.length) return null

  const fechaRef = referenciaIso || toIsoDate(new Date())
  const proximaFecha = combo.cronograma?.activo
    ? getProximaFechaProgramada(combo.cronograma, fechaRef)
    : null

  if (proximaFecha) {
    const calculada = getRondaParaFecha(combo, proximaFecha)
    if (calculada) {
      return {
        ronda: calculada.ronda,
        indice: calculada.indice,
        total: calculada.total,
        proximaFecha,
      }
    }
  }

  const idx = ((combo.rondaActual ?? 0) % rondas.length + rondas.length) % rondas.length
  return { ronda: rondas[idx], indice: idx, total: rondas.length, proximaFecha: null }
}

function mapCombo(row, rondas = [], cronograma = null) {
  const combo = {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || '',
    categoriaId: row.categoria_id || null,
    categoriaNombre: row.categoria_nombre || '',
    activo: Boolean(row.activo),
    rondaActual: Number(row.ronda_actual ?? 0),
    rondas,
    cronograma,
    creadoPor: {
      cedula: row.creado_por_cedula || '',
      nombre: row.creado_por_nombre || '',
    },
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
  }
  const activa = getRondaActiva(combo, toIsoDate(new Date()))
  combo.rondaActiva = activa
    ? {
        indice: activa.indice,
        total: activa.total,
        nombre: activa.ronda.nombre,
        productos: activa.ronda.productos,
        proximaFecha: activa.proximaFecha,
      }
    : null
  return combo
}

export class BitacoraComboRepositoryMysql {
  async _defaultCategoriaId() {
    const rows = await query(
      "SELECT id FROM bitacora_combo_categorias WHERE activo = 1 ORDER BY orden ASC LIMIT 1",
    )
    return rows[0]?.id ?? null
  }

  async findAll() {
    const rows = await query(
      `${comboSelectSql('c')} WHERE c.activo = 1 ORDER BY c.nombre ASC`,
    )
    const ids = rows.map((r) => r.id)
    const rondaMap = await loadRondas(ids)
    const cronMap = await loadCronogramas(ids)
    return rows.map((r) =>
      mapCombo(r, rondaMap.get(r.id) || [], cronMap.get(r.id) || null),
    )
  }

  async findById(id) {
    const rows = await query(`${comboSelectSql('c')} WHERE c.id = ? LIMIT 1`, [id])
    if (!rows.length) return null
    const rondaMap = await loadRondas([id])
    const cronMap = await loadCronogramas([id])
    return mapCombo(rows[0], rondaMap.get(id) || [], cronMap.get(id) || null)
  }

  async _saveRondas(comboId, rondasInput) {
    await query('DELETE FROM bitacora_combo_rondas WHERE combo_id = ?', [comboId])

    let orden = 1
    for (const ronda of rondasInput) {
      const rondaId = uuidv4()
      await query(
        `INSERT INTO bitacora_combo_rondas (id, combo_id, orden, nombre) VALUES (?, ?, ?, ?)`,
        [rondaId, comboId, orden, ronda.nombre || `Ronda ${orden}`],
      )

      let prodOrden = 1
      for (const p of ronda.productos || []) {
        const nombre = String(p.nombre ?? '').trim()
        if (!nombre) continue
        await query(
          `INSERT INTO bitacora_combo_productos (id, combo_id, ronda_id, orden, nombre, proposito, dosis)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            comboId,
            rondaId,
            prodOrden++,
            nombre,
            String(p.proposito ?? '').trim(),
            String(p.dosis ?? '').trim(),
          ],
        )
      }
      orden++
    }
  }

  async create(data, auditUser) {
    const id = uuidv4()
    const rondas = normalizeRondasInput(data)
    let categoriaId = normalizeCategoriaId(data.categoriaId)
    if (!categoriaId) categoriaId = await this._defaultCategoriaId()

    await query(
      `INSERT INTO bitacora_combos (id, nombre, descripcion, categoria_id, ronda_actual, creado_por_cedula, creado_por_nombre)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        data.nombre.trim(),
        data.descripcion?.trim() || '',
        categoriaId,
        auditUser?.cedula || null,
        auditName(auditUser),
      ],
    )
    await this._saveRondas(id, rondas)
    return this.findById(id)
  }

  async update(id, data) {
    const existing = await this.findById(id)
    if (!existing) return null

    const rondas = normalizeRondasInput(data)
    const numRondas = Math.max(rondas.length, 1)
    const rondaActual = ((existing.rondaActual ?? 0) % numRondas + numRondas) % numRondas

    await query(
      'UPDATE bitacora_combos SET nombre = ?, descripcion = ?, categoria_id = ?, ronda_actual = ? WHERE id = ?',
      [
        data.nombre.trim(),
        data.descripcion?.trim() || '',
        normalizeCategoriaId(data.categoriaId ?? existing.categoriaId) || existing.categoriaId,
        rondaActual,
        id,
      ],
    )
    await this._saveRondas(id, rondas)
    return this.findById(id)
  }

  async delete(id) {
    const result = await query('UPDATE bitacora_combos SET activo = 0 WHERE id = ?', [id])
    return result.affectedRows > 0
  }

  async saveCronograma(comboId, diasSemana) {
    const combo = await this.findById(comboId)
    if (!combo) return { ok: false, error: 'Combo no encontrado' }

    const diasRaw = [...new Set((diasSemana || []).map(Number).filter((n) => n >= 0 && n <= 6))]

    const existing = await query(
      'SELECT id FROM bitacora_combo_cronograma WHERE combo_id = ? LIMIT 1',
      [comboId],
    )

    if (!diasRaw.length) {
      if (existing.length) {
        await query(
          'UPDATE bitacora_combo_cronograma SET dias_semana = ?, activo = 0 WHERE combo_id = ?',
          ['[]', comboId],
        )
      }
      return { ok: true, cronograma: { diasSemana: [], activo: false } }
    }

    const dias = [diasRaw[0]]
    const json = JSON.stringify(dias)
    const hoy = toIsoDate(new Date())
    const diaAnterior = cronogramaDiaSemana(combo.cronograma)
    const reiniciarRotacion = diaAnterior == null || diaAnterior !== dias[0]

    const fechaInicio =
      reiniciarRotacion
        ? hoy
        : combo.cronograma?.fechaInicio || hoy

    if (existing.length) {
      await this._updateCronogramaActivo(comboId, json, fechaInicio)
    } else {
      await this._insertCronogramaActivo(comboId, json, fechaInicio)
    }

    return { ok: true, cronograma: { diasSemana: dias, fechaInicio, activo: true } }
  }

  async _updateCronogramaActivo(comboId, json, fechaInicio) {
    try {
      await query(
        'UPDATE bitacora_combo_cronograma SET dias_semana = ?, fecha_inicio = ?, activo = 1 WHERE combo_id = ?',
        [json, fechaInicio, comboId],
      )
    } catch (e) {
      if (!/fecha_inicio/i.test(String(e.message))) throw e
      await query(
        'UPDATE bitacora_combo_cronograma SET dias_semana = ?, activo = 1 WHERE combo_id = ?',
        [json, comboId],
      )
    }
  }

  async _insertCronogramaActivo(comboId, json, fechaInicio) {
    try {
      await query(
        `INSERT INTO bitacora_combo_cronograma (id, combo_id, dias_semana, fecha_inicio, activo)
         VALUES (?, ?, ?, ?, 1)`,
        [uuidv4(), comboId, json, fechaInicio],
      )
    } catch (e) {
      if (!/fecha_inicio/i.test(String(e.message))) throw e
      await query(
        `INSERT INTO bitacora_combo_cronograma (id, combo_id, dias_semana, activo)
         VALUES (?, ?, ?, 1)`,
        [uuidv4(), comboId, json],
      )
    }
  }

  async isCompleted(comboId, fecha) {
    const rows = await query(
      'SELECT id FROM bitacora_combo_completados WHERE combo_id = ? AND fecha = ? LIMIT 1',
      [comboId, fecha],
    )
    return rows.length > 0
  }

  async getTareasHoy(fechaIso) {
    return this.getTareasParaFecha(fechaIso || toIsoDate(new Date()))
  }

  async getTareasParaFecha(fechaIso) {
    const fecha = fechaIso || toIsoDate(new Date())
    const diaSemana = diaSemanaDe(fecha)

    const combos = await this.findAll()
    const tareas = []

    for (const combo of combos) {
      if (!combo.cronograma?.activo || !combo.cronograma.diasSemana?.length) continue
      if (!combo.cronograma.diasSemana.includes(diaSemana)) continue

      const activa = getRondaParaFecha(combo, fecha)
      if (!activa?.productos?.length) continue

      const completado = await this.isCompleted(combo.id, fecha)
      tareas.push({
        comboId: combo.id,
        nombre: combo.nombre,
        descripcion: combo.descripcion,
        categoriaId: combo.categoriaId,
        categoriaNombre: combo.categoriaNombre,
        rondaIndice: activa.indice,
        rondaTotal: activa.total,
        rondaNombre: activa.nombre,
        productos: activa.productos,
        fecha,
        completado,
      })
    }

    return tareas
  }

  async getTareasPendientesConfirmacion(hastaIso) {
    const hoy = hastaIso || toIsoDate(new Date())
    const combos = await this.findAll()
    const activos = combos.filter((c) => c.cronograma?.activo && cronogramaDiaSemana(c.cronograma) != null)
    if (!activos.length) return []

    const comboIds = activos.map((c) => c.id)
    const placeholders = comboIds.map(() => '?').join(',')
    const completadosRows = await query(
      `SELECT combo_id, fecha FROM bitacora_combo_completados WHERE combo_id IN (${placeholders})`,
      comboIds,
    )
    const completadosSet = new Set(
      completadosRows.map((r) => {
        const f =
          r.fecha instanceof Date ? toIsoDate(r.fecha) : String(r.fecha).slice(0, 10)
        return `${r.combo_id}|${f}`
      }),
    )

    const ayer = parseFechaIso(hoy)
    ayer.setDate(ayer.getDate() - 1)
    const pendientes = []

    for (const combo of activos) {
      const diaSemana = cronogramaDiaSemana(combo.cronograma)
      const fechaInicio =
        combo.cronograma.fechaInicio ||
        (combo.cronograma.actualizadoEn instanceof Date
          ? toIsoDate(combo.cronograma.actualizadoEn)
          : String(combo.cronograma.actualizadoEn || combo.createdAt || '').slice(0, 10))
      if (!fechaInicio) continue

      const cur = parseFechaIso(fechaInicio)
      while (cur <= ayer) {
        if (cur.getDay() === diaSemana) {
          const iso = toIsoDate(cur)
          if (!completadosSet.has(`${combo.id}|${iso}`)) {
            const activa = getRondaParaFecha(combo, iso)
            if (activa?.productos?.length) {
              pendientes.push({
                comboId: combo.id,
                nombre: combo.nombre,
                descripcion: combo.descripcion,
                categoriaId: combo.categoriaId,
                categoriaNombre: combo.categoriaNombre,
                rondaIndice: activa.indice,
                rondaTotal: activa.total,
                rondaNombre: activa.nombre,
                productos: activa.productos,
                fecha: iso,
                completado: false,
                atrasada: true,
              })
              break
            }
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
    }

    return pendientes
  }

  async marcarCompletado(comboId, fecha, auditUser) {
    const combo = await this.findById(comboId)
    if (!combo) return { ok: false, error: 'Combo no encontrado' }

    const f = fecha || new Date().toISOString().slice(0, 10)
    const existing = await query(
      'SELECT id FROM bitacora_combo_completados WHERE combo_id = ? AND fecha = ? LIMIT 1',
      [comboId, f],
    )

    if (existing.length) {
      return { ok: true, already: true }
    }

    const activa = getRondaParaFecha(combo, f)
    const rondaIndice = activa?.indice ?? 0

    await query(
      `INSERT INTO bitacora_combo_completados
       (id, combo_id, fecha, ronda_indice, usuario_cedula, usuario_nombre)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), comboId, f, rondaIndice, auditUser?.cedula || null, auditName(auditUser)],
    )

    return { ok: true, rondaIndice }
  }
}
