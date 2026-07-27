import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'
import { mapMovimientoRow, mapProductoRow } from '../../../shared/mappers.js'

const CATEGORIA_PREFIX = {
  fertilizante: 'T',
  fungicida: 'F',
  insecticida: 'I',
  abono: 'A',
  herbicida: 'B',
  herramienta: 'H',
  material: 'M',
}

const CATEGORIA_ORDER_SQL =
  "'fertilizante', 'fungicida', 'insecticida', 'abono', 'herbicida', 'herramienta', 'material'"

export class InventoryRepositoryMysql {
  async findAllProductos() {
    const rows = await query(
      `SELECT * FROM inventario_productos
       ORDER BY FIELD(categoria, ${CATEGORIA_ORDER_SQL}), codigo`,
    )
    return rows.map(mapProductoRow)
  }

  async findAllMovimientos() {
    const rows = await query('SELECT * FROM inventario_movimientos ORDER BY fecha DESC')
    return rows.map(mapMovimientoRow)
  }

  async getNextCode(categoria) {
    const prefix = CATEGORIA_PREFIX[categoria] || 'H'
    const rows = await query(
      `SELECT codigo FROM inventario_productos WHERE categoria = ? AND codigo LIKE ?`,
      [categoria, `${prefix}%`],
    )
    let max = 0
    for (const row of rows) {
      const m = String(row.codigo).match(new RegExp(`^${prefix}(\\d+)$`))
      if (m) max = Math.max(max, Number(m[1]))
    }
    return `${prefix}${max + 1}`
  }

  async createProducto(data, auditUser) {
    const id = uuidv4()
    const code = await this.getNextCode(data.categoria)
    const now = new Date()

    await query(
      `INSERT INTO inventario_productos
       (id, codigo, nombre, categoria, unidad, stock, descripcion, creado_en,
        creado_por_cedula, creado_por_nombre, creado_por_rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        code,
        data.nombre,
        data.categoria,
        data.unidad || 'unidad',
        data.stockInicial || 0,
        data.descripcion || '',
        now,
        auditUser.cedula || null,
        auditUser.nombre || null,
        auditUser.role === 'administrador' ? 'administrador' : auditUser.role === 'desarrollador' ? 'administrador' : 'trabajador',
      ],
    )

    const rows = await query('SELECT * FROM inventario_productos WHERE id = ?', [id])
    return mapProductoRow(rows[0])
  }

  async updateProducto(productoId, data) {
    const prodRows = await query('SELECT * FROM inventario_productos WHERE id = ?', [productoId])
    if (!prodRows.length) return { ok: false, error: 'Producto no encontrado' }

    const updates = []
    const params = []

    if (data.categoria && CATEGORIA_PREFIX[data.categoria]) {
      updates.push('categoria = ?')
      params.push(data.categoria)
    }

    if (data.metodoUso !== undefined) {
      updates.push('metodo_uso = ?')
      params.push(String(data.metodoUso ?? ''))
    }

    if (!updates.length) return { ok: false, error: 'Sin cambios' }

    params.push(productoId)
    await query(`UPDATE inventario_productos SET ${updates.join(', ')} WHERE id = ?`, params)

    const rows = await query('SELECT * FROM inventario_productos WHERE id = ?', [productoId])
    return { ok: true, producto: mapProductoRow(rows[0]) }
  }

  async deleteProducto(productoId) {
    // Se permite eliminar aunque tenga movimientos: se borran primero los movimientos.
    const movementsResult = await query(
      'DELETE FROM inventario_movimientos WHERE producto_id = ?',
      [productoId],
    )
    const productResult = await query('DELETE FROM inventario_productos WHERE id = ?', [productoId])
    return {
      ok: productResult.affectedRows > 0,
      deletedMovimientos: movementsResult.affectedRows ?? 0,
    }
  }

  async registrarMovimiento({ productoId, cantidad, tipo, nota, auditUser }) {
    const prodRows = await query('SELECT * FROM inventario_productos WHERE id = ?', [productoId])
    if (!prodRows.length) return { ok: false, error: 'Producto no encontrado' }

    const producto = prodRows[0]
    const qty = Number(cantidad)
    if (tipo === 'salida' && producto.stock < qty) {
      return { ok: false, error: 'Stock insuficiente' }
    }

    const nuevoStock = tipo === 'ingreso' ? producto.stock + qty : producto.stock - qty
    await query('UPDATE inventario_productos SET stock = ? WHERE id = ?', [nuevoStock, productoId])

    const id = uuidv4()
    const now = new Date()
    const rol =
      auditUser.role === 'administrador' || auditUser.role === 'desarrollador'
        ? 'administrador'
        : 'trabajador'

    await query(
      `INSERT INTO inventario_movimientos
       (id, tipo, producto_id, producto_codigo, producto_nombre, categoria, cantidad, unidad,
        stock_resultante, nota, fecha, usuario_cedula, usuario_nombre, usuario_rol)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        tipo,
        productoId,
        producto.codigo,
        producto.nombre,
        producto.categoria,
        qty,
        producto.unidad,
        nuevoStock,
        nota || '',
        now,
        auditUser.cedula || null,
        auditUser.nombre || null,
        rol,
      ],
    )

    const rows = await query('SELECT * FROM inventario_movimientos WHERE id = ?', [id])
    return { ok: true, movimiento: mapMovimientoRow(rows[0]) }
  }

  async clearAll() {
    await query('DELETE FROM inventario_movimientos')
    await query('DELETE FROM inventario_productos')
  }
}
