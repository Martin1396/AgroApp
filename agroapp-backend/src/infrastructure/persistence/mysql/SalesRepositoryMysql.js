import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'
import { mapVariedadRow, mapVentaRow } from '../../../shared/mappers.js'

async function loadVariedades(ventaIds) {
  if (!ventaIds.length) return new Map()
  const placeholders = ventaIds.map(() => '?').join(',')
  const rows = await query(
    `SELECT * FROM venta_variedades WHERE venta_id IN (${placeholders}) ORDER BY orden`,
    ventaIds,
  )
  const map = new Map()
  for (const row of rows) {
    const list = map.get(row.venta_id) || []
    list.push(mapVariedadRow(row))
    map.set(row.venta_id, list)
  }
  return map
}

export class SalesRepositoryMysql {
  async findAll() {
    const rows = await query('SELECT * FROM ventas ORDER BY secuencia DESC')
    const varMap = await loadVariedades(rows.map((r) => r.id))
    return rows.map((r) => mapVentaRow(r, varMap.get(r.id) || []))
  }

  async findActive() {
    const rows = await query(
      'SELECT * FROM ventas WHERE pago_confirmado = 0 ORDER BY secuencia DESC',
    )
    const varMap = await loadVariedades(rows.map((r) => r.id))
    return rows.map((r) => mapVentaRow(r, varMap.get(r.id) || []))
  }

  async findHistorial() {
    const rows = await query(
      'SELECT * FROM ventas WHERE pago_confirmado = 1 ORDER BY fecha_pago_confirmado DESC',
    )
    const varMap = await loadVariedades(rows.map((r) => r.id))
    return rows.map((r) => mapVentaRow(r, varMap.get(r.id) || []))
  }

  async getNextSequence() {
    const rows = await query('SELECT COALESCE(MAX(secuencia), 0) + 1 AS next_seq FROM ventas')
    return rows[0].next_seq
  }

  async create(data) {
    const sequence = await this.getNextSequence()
    const id = uuidv4()
    const now = new Date()

    await query(
      `INSERT INTO ventas
       (id, secuencia, cliente, tipo_flor, moneda, precio_venta, produccion_id, produccion_etiqueta,
        comprobante_pago, comprobante_nombre, pago_confirmado, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, '', 0, ?)`,
      [
        id,
        sequence,
        data.cliente,
        data.tipoFlor,
        data.moneda,
        data.precioVenta,
        data.productionId ?? null,
        data.productionLabel ?? null,
        now,
      ],
    )

    await this._saveVariedades(id, data.variedades)

    const rows = await query('SELECT * FROM ventas WHERE id = ?', [id])
    const variedades = await loadVariedades([id])
    return mapVentaRow(rows[0], variedades.get(id) || [])
  }

  async _saveVariedades(ventaId, variedades) {
    await query('DELETE FROM venta_variedades WHERE venta_id = ?', [ventaId])
    let orden = 1
    for (const v of variedades || []) {
      await query(
        `INSERT INTO venta_variedades (id, venta_id, orden, nombre, tallos, precio_por_unidad)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), ventaId, orden++, v.nombre, v.tallos, v.precioPorUnidad],
      )
    }
  }

  async update(ventaId, data) {
    await query(
      `UPDATE ventas SET cliente = ?, tipo_flor = ?, moneda = ?, precio_venta = ?,
       produccion_id = ?, produccion_etiqueta = ? WHERE id = ?`,
      [
        data.cliente,
        data.tipoFlor,
        data.moneda,
        data.precioVenta,
        data.productionId ?? null,
        data.productionLabel ?? null,
        ventaId,
      ],
    )
    await this._saveVariedades(ventaId, data.variedades)
    const rows = await query('SELECT * FROM ventas WHERE id = ?', [ventaId])
    if (!rows.length) return null
    const varMap = await loadVariedades([ventaId])
    return mapVentaRow(rows[0], varMap.get(ventaId) || [])
  }

  async attachComprobante(ventaId, dataUrl, fileName) {
    const result = await query(
      'UPDATE ventas SET comprobante_pago = ?, comprobante_nombre = ? WHERE id = ?',
      [dataUrl, fileName, ventaId],
    )
    return result.affectedRows > 0
  }

  async confirmarPago(ventaId) {
    const now = new Date()
    const result = await query(
      'UPDATE ventas SET pago_confirmado = 1, fecha_pago_confirmado = ? WHERE id = ?',
      [now, ventaId],
    )
    return result.affectedRows > 0
  }

  async delete(ventaId) {
    const result = await query('DELETE FROM ventas WHERE id = ?', [ventaId])
    return result.affectedRows > 0
  }

  async clearHistorial() {
    await query('DELETE FROM venta_variedades WHERE venta_id IN (SELECT id FROM ventas WHERE pago_confirmado = 1)')
    await query('DELETE FROM ventas WHERE pago_confirmado = 1')
  }

  async clearAll() {
    await query('DELETE FROM venta_variedades')
    await query('DELETE FROM ventas')
  }
}
