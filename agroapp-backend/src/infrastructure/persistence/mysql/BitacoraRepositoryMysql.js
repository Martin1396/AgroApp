import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'
import { mapBitacoraRow } from '../../../shared/mappers.js'

async function loadProductos(registroIds) {
  if (!registroIds.length) return new Map()
  const placeholders = registroIds.map(() => '?').join(',')
  const rows = await query(
    `SELECT * FROM bitacora_productos WHERE registro_id IN (${placeholders}) ORDER BY orden`,
    registroIds,
  )
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.registro_id) || []
    list.push({
      id: row.id,
      nombre: row.nombre,
      dosis: row.dosis || '',
    })
    map.set(row.registro_id, list)
  }
  return map
}

function formatCode(sequence) {
  return `B${String(sequence).padStart(5, '0')}`
}

function auditName(user) {
  if (!user) return ''
  return [user.nombre, user.apellido].filter(Boolean).join(' ').trim() || user.cedula || ''
}

export class BitacoraRepositoryMysql {
  async findAll() {
    const rows = await query('SELECT * FROM bitacora_registros ORDER BY fecha DESC, secuencia DESC')
    const prodMap = await loadProductos(rows.map((r) => r.id))
    return rows.map((r) => mapBitacoraRow(r, prodMap.get(r.id) || []))
  }

  async findById(id) {
    const rows = await query('SELECT * FROM bitacora_registros WHERE id = ? LIMIT 1', [id])
    if (!rows.length) return null
    const prodMap = await loadProductos([id])
    return mapBitacoraRow(rows[0], prodMap.get(id) || [])
  }

  async getNextSequence() {
    const rows = await query('SELECT COALESCE(MAX(secuencia), 0) + 1 AS next_seq FROM bitacora_registros')
    return rows[0].next_seq
  }

  async _saveProductos(registroId, productos) {
    await query('DELETE FROM bitacora_productos WHERE registro_id = ?', [registroId])
    let orden = 1
    for (const p of productos || []) {
      const nombre = String(p.nombre ?? '').trim()
      if (!nombre) continue
      await query(
        `INSERT INTO bitacora_productos (id, registro_id, orden, nombre, dosis)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), registroId, orden++, nombre, String(p.dosis ?? '').trim()],
      )
    }
  }

  async create(data, auditUser) {
    const sequence = await this.getNextSequence()
    const id = uuidv4()
    const code = formatCode(sequence)

    await query(
      `INSERT INTO bitacora_registros
       (id, secuencia, codigo, fecha, tipo_labor, ubicacion, proposito, observaciones,
        registrado_por_cedula, registrado_por_nombre, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sequence,
        code,
        data.fecha,
        data.tipoLabor,
        data.ubicacion || '',
        data.proposito,
        data.observaciones || '',
        auditUser?.cedula || null,
        auditName(auditUser),
        new Date(),
      ],
    )

    await this._saveProductos(id, data.productos)
    return this.findById(id)
  }

  async update(id, data) {
    const existing = await this.findById(id)
    if (!existing) return null

    await query(
      `UPDATE bitacora_registros
       SET fecha = ?, tipo_labor = ?, ubicacion = ?, proposito = ?, observaciones = ?
       WHERE id = ?`,
      [
        data.fecha,
        data.tipoLabor,
        data.ubicacion || '',
        data.proposito,
        data.observaciones || '',
        id,
      ],
    )

    await this._saveProductos(id, data.productos)
    return this.findById(id)
  }

  async delete(id) {
    const result = await query('DELETE FROM bitacora_registros WHERE id = ?', [id])
    return result.affectedRows > 0
  }
}
