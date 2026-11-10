import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'

function mapCierreRow(row) {
  let detalle = row.detalle_json
  if (typeof detalle === 'string') {
    try {
      detalle = JSON.parse(detalle)
    } catch {
      detalle = null
    }
  }
  return {
    id: row.id,
    anio: row.anio,
    mes: row.mes,
    periodoInicio: row.periodo_inicio instanceof Date ? row.periodo_inicio.toISOString() : row.periodo_inicio,
    periodoFin: row.periodo_fin instanceof Date ? row.periodo_fin.toISOString() : row.periodo_fin,
    trm: Number(row.trm),
    totalCop: Number(row.total_cop),
    totalUsd: Number(row.total_usd),
    cantidadVentas: Number(row.cantidad_ventas),
    detalle,
    cerradoEn: row.cerrado_en instanceof Date ? row.cerrado_en.toISOString() : row.cerrado_en,
  }
}

export class SalesCierreRepositoryMysql {
  async findAll() {
    const rows = await query(
      'SELECT * FROM ventas_cierres_mes ORDER BY anio DESC, mes DESC',
    )
    return rows.map(mapCierreRow)
  }

  async findLatest() {
    const rows = await query(
      'SELECT * FROM ventas_cierres_mes ORDER BY anio DESC, mes DESC LIMIT 1',
    )
    return rows[0] ? mapCierreRow(rows[0]) : null
  }

  async findByYearMonth(anio, mes) {
    const rows = await query(
      'SELECT * FROM ventas_cierres_mes WHERE anio = ? AND mes = ? LIMIT 1',
      [anio, mes],
    )
    return rows[0] ? mapCierreRow(rows[0]) : null
  }

  async create({ anio, mes, periodoInicio, periodoFin, trm, totalCop, totalUsd, cantidadVentas, detalle }) {
    const id = uuidv4()
    const now = new Date()
    await query(
      `INSERT INTO ventas_cierres_mes
       (id, anio, mes, periodo_inicio, periodo_fin, trm, total_cop, total_usd, cantidad_ventas, detalle_json, cerrado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        anio,
        mes,
        periodoInicio,
        periodoFin,
        trm,
        totalCop,
        totalUsd,
        cantidadVentas,
        JSON.stringify(detalle ?? null),
        now,
      ],
    )
    return this.findByYearMonth(anio, mes)
  }
}
