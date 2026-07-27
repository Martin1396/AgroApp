import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'

function mapComercializadora(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: Boolean(row.activo),
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
  }
}

function mapVariedad(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    activo: Boolean(row.activo),
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
  }
}

export class SalesCatalogRepositoryMysql {
  async findAllComercializadoras() {
    const rows = await query(
      'SELECT * FROM comercializadoras WHERE activo = 1 ORDER BY nombre ASC',
    )
    return rows.map(mapComercializadora)
  }

  async createComercializadora(nombre) {
    const trimmed = String(nombre ?? '').trim()
    if (!trimmed) return { ok: false, error: 'Ingresa el nombre de la comercializadora' }

    const existing = await query(
      'SELECT id FROM comercializadoras WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [trimmed],
    )
    if (existing.length) {
      return { ok: false, error: 'Ya existe una comercializadora con ese nombre' }
    }

    const id = uuidv4()
    await query('INSERT INTO comercializadoras (id, nombre) VALUES (?, ?)', [id, trimmed])
    const rows = await query('SELECT * FROM comercializadoras WHERE id = ?', [id])
    return { ok: true, item: mapComercializadora(rows[0]) }
  }

  async deleteComercializadora(id) {
    const result = await query('UPDATE comercializadoras SET activo = 0 WHERE id = ?', [id])
    return { ok: result.affectedRows > 0 }
  }

  async findAllVariedades() {
    const rows = await query(
      'SELECT * FROM variedades_catalogo WHERE activo = 1 ORDER BY nombre ASC',
    )
    return rows.map(mapVariedad)
  }

  async createVariedad(nombre) {
    const trimmed = String(nombre ?? '').trim()
    if (!trimmed) return { ok: false, error: 'Ingresa el nombre de la variedad' }

    const existing = await query(
      'SELECT id FROM variedades_catalogo WHERE LOWER(nombre) = LOWER(?) LIMIT 1',
      [trimmed],
    )
    if (existing.length) {
      return { ok: false, error: 'Ya existe una variedad con ese nombre' }
    }

    const id = uuidv4()
    await query('INSERT INTO variedades_catalogo (id, nombre) VALUES (?, ?)', [id, trimmed])
    const rows = await query('SELECT * FROM variedades_catalogo WHERE id = ?', [id])
    return { ok: true, item: mapVariedad(rows[0]) }
  }

  async deleteVariedad(id) {
    const result = await query('UPDATE variedades_catalogo SET activo = 0 WHERE id = ?', [id])
    return { ok: result.affectedRows > 0 }
  }
}
