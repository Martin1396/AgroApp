import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'

function mapCategoria(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    orden: row.orden,
    activo: Boolean(row.activo),
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
  }
}

export class BitacoraComboCategoriaRepositoryMysql {
  async findAll() {
    const rows = await query(
      'SELECT * FROM bitacora_combo_categorias WHERE activo = 1 ORDER BY orden ASC, nombre ASC',
    )
    return rows.map(mapCategoria)
  }

  async findById(id) {
    const rows = await query(
      'SELECT * FROM bitacora_combo_categorias WHERE id = ? AND activo = 1 LIMIT 1',
      [id],
    )
    return rows.length ? mapCategoria(rows[0]) : null
  }

  async create(nombre) {
    const n = String(nombre ?? '').trim()
    if (!n) return { ok: false, error: 'El nombre de la categoría es obligatorio' }

    const existing = await query(
      'SELECT id FROM bitacora_combo_categorias WHERE nombre = ? AND activo = 1 LIMIT 1',
      [n],
    )
    if (existing.length) return { ok: false, error: 'Ya existe una categoría con ese nombre' }

    const ordenRows = await query(
      'SELECT COALESCE(MAX(orden), 0) + 1 AS next_ord FROM bitacora_combo_categorias WHERE activo = 1',
    )
    const id = uuidv4()
    await query(
      'INSERT INTO bitacora_combo_categorias (id, nombre, orden) VALUES (?, ?, ?)',
      [id, n, ordenRows[0].next_ord],
    )
    const item = await this.findById(id)
    return { ok: true, item }
  }

  async delete(id) {
    const cat = await this.findById(id)
    if (!cat) return { ok: false, error: 'Categoría no encontrada' }

    const combos = await query(
      'SELECT COUNT(*) AS n FROM bitacora_combos WHERE categoria_id = ? AND activo = 1',
      [id],
    )
    if (combos[0].n > 0) {
      return { ok: false, error: 'No se puede eliminar: tiene combos asignados' }
    }

    await query('UPDATE bitacora_combo_categorias SET activo = 0 WHERE id = ?', [id])
    return { ok: true }
  }
}
