import bcrypt from 'bcryptjs'
import { query } from './pool.js'
import { mapUserRow } from '../../../shared/mappers.js'

export class UserRepositoryMysql {
  async listActive() {
    const rows = await query(
      `SELECT cedula, nombre, apellido, rol, activo, creado_en, actualizado_en
       FROM usuarios
       WHERE activo = 1
       ORDER BY rol ASC, apellido ASC, nombre ASC`,
    )
    return rows
  }

  async findByCedula(cedula) {
    const rows = await query(
      'SELECT cedula, nombre, apellido, password_hash, rol, activo FROM usuarios WHERE cedula = ? AND activo = 1 LIMIT 1',
      [cedula],
    )
    return rows[0] ?? null
  }

  async verifyPassword(row, plainPassword) {
    if (!row?.password_hash) return false
    if (row.password_hash.startsWith('$2')) {
      return bcrypt.compare(plainPassword, row.password_hash)
    }
    return row.password_hash === plainPassword
  }

  async toPublicUser(row) {
    return mapUserRow(row)
  }

  async create({ cedula, nombre, apellido, password, rol }) {
    const hash = await bcrypt.hash(password, 10)
    await query(
      `INSERT INTO usuarios (cedula, nombre, apellido, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [cedula, nombre, apellido, hash, rol === 'administrador' ? 'administrador' : 'trabajador'],
    )
    return this.findByCedula(cedula)
  }

  async updatePassword(cedula, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10)
    const result = await query(
      'UPDATE usuarios SET password_hash = ? WHERE cedula = ? AND activo = 1',
      [hash, cedula],
    )
    return result.affectedRows > 0
  }

  async updateProfile(cedula, { nombre, apellido, rol }) {
    const result = await query(
      'UPDATE usuarios SET nombre = ?, apellido = ?, rol = ? WHERE cedula = ? AND activo = 1',
      [
        nombre,
        apellido,
        rol === 'administrador' ? 'administrador' : 'trabajador',
        cedula,
      ],
    )
    return result.affectedRows > 0
  }

  async exists(cedula) {
    const rows = await query('SELECT 1 FROM usuarios WHERE cedula = ? LIMIT 1', [cedula])
    return rows.length > 0
  }

  async deactivate(cedula) {
    const result = await query('UPDATE usuarios SET activo = 0 WHERE cedula = ?', [cedula])
    return result.affectedRows > 0
  }
}
