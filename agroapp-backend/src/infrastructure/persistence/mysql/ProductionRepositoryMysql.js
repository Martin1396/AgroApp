import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'
import { mapCorteRow, mapProductionRow } from '../../../shared/mappers.js'

async function loadCortes(productionIds) {
  if (!productionIds.length) return new Map()
  const placeholders = productionIds.map(() => '?').join(',')
  const rows = await query(
    `SELECT * FROM produccion_cortes WHERE produccion_id IN (${placeholders}) ORDER BY secuencia`,
    productionIds,
  )
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.produccion_id) || []
    list.push(mapCorteRow(row))
    map.set(row.produccion_id, list)
  }
  return map
}

export class ProductionRepositoryMysql {
  async findAll() {
    const rows = await query('SELECT * FROM producciones ORDER BY secuencia DESC')
    const cortesMap = await loadCortes(rows.map((r) => r.id))
    return rows.map((r) => mapProductionRow(r, cortesMap.get(r.id) || []))
  }

  async findActive() {
    const rows = await query(
      'SELECT * FROM producciones WHERE finalizada = 0 ORDER BY creado_en DESC',
    )
    const cortesMap = await loadCortes(rows.map((r) => r.id))
    return rows.map((r) => mapProductionRow(r, cortesMap.get(r.id) || []))
  }

  async findHistorial() {
    const rows = await query(
      'SELECT * FROM producciones WHERE finalizada = 1 ORDER BY fecha_finalizacion DESC',
    )
    const cortesMap = await loadCortes(rows.map((r) => r.id))
    return rows.map((r) => mapProductionRow(r, cortesMap.get(r.id) || []))
  }

  async getNextSequence() {
    const rows = await query('SELECT COALESCE(MAX(secuencia), 0) + 1 AS next_seq FROM producciones')
    return rows[0].next_seq
  }

  async findActiveCamasConflict(desdeCama, hastaCama) {
    const rows = await query(
      `SELECT * FROM producciones
       WHERE finalizada = 0
         AND LEAST(desde_cama, hasta_cama) <= ?
         AND GREATEST(desde_cama, hasta_cama) >= ?`,
      [Math.max(desdeCama, hastaCama), Math.min(desdeCama, hastaCama)],
    )
    if (!rows.length) return null
    return mapProductionRow(rows[0], [])
  }

  async create({ desdeCama, hastaCama, cantidadPlantas }) {
    const sequence = await this.getNextSequence()
    const id = uuidv4()
    const code = String(sequence).padStart(5, '0')
    const now = new Date()

    await query(
      `INSERT INTO producciones
       (id, secuencia, codigo, desde_cama, hasta_cama, cantidad_plantas, finalizada, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, sequence, code, desdeCama, hastaCama, cantidadPlantas ?? null, now],
    )

    const rows = await query('SELECT * FROM producciones WHERE id = ?', [id])
    return mapProductionRow(rows[0], [])
  }

  async addCorte(productionId, cantidad) {
    const prodRows = await query('SELECT id FROM producciones WHERE id = ?', [productionId])
    if (!prodRows.length) return null

    const seqRows = await query(
      'SELECT COALESCE(MAX(secuencia), 0) + 1 AS next_seq FROM produccion_cortes WHERE produccion_id = ?',
      [productionId],
    )
    const sequence = seqRows[0].next_seq
    const id = uuidv4()
    const now = new Date()

    await query(
      `INSERT INTO produccion_cortes (id, produccion_id, secuencia, cantidad, fecha)
       VALUES (?, ?, ?, ?, ?)`,
      [id, productionId, sequence, cantidad, now],
    )

    const rows = await query('SELECT * FROM produccion_cortes WHERE id = ?', [id])
    return mapCorteRow(rows[0])
  }

  async updateCorte(productionId, corteId, { cantidad, fecha }) {
    const result = await query(
      `UPDATE produccion_cortes SET cantidad = ?, fecha = ?
       WHERE id = ? AND produccion_id = ?`,
      [cantidad, fecha ? new Date(fecha) : new Date(), corteId, productionId],
    )
    return result.affectedRows > 0
  }

  async finalize(productionId) {
    const now = new Date()
    const result = await query(
      'UPDATE producciones SET finalizada = 1, fecha_finalizacion = ? WHERE id = ?',
      [now, productionId],
    )
    return result.affectedRows > 0
  }

  async delete(productionId) {
    const result = await query('DELETE FROM producciones WHERE id = ?', [productionId])
    return result.affectedRows > 0
  }

  async clearHistorial() {
    await query('DELETE FROM producciones WHERE finalizada = 1')
  }

  async clearAll() {
    await query('DELETE FROM produccion_cortes')
    await query('DELETE FROM producciones')
  }
}
