import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { query } from './pool.js'
import { env } from '../../../config/env.js'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export class SessionRepositoryMysql {
  async create(usuarioCedula) {
    const token = uuidv4() + uuidv4()
    const id = uuidv4()
    const tokenHash = hashToken(token)
    const ttlMs = env.sessionTtlDays * 24 * 60 * 60 * 1000
    const expira = new Date(Date.now() + ttlMs)

    await query(
      `INSERT INTO sesiones (id, usuario_cedula, token_hash, expira_en)
       VALUES (?, ?, ?, ?)`,
      [id, usuarioCedula, tokenHash, expira],
    )

    return { id, token, expiraEn: expira.toISOString() }
  }

  async findValidByToken(token) {
    const tokenHash = hashToken(token)
    const rows = await query(
      `SELECT s.id, s.usuario_cedula, s.expira_en,
              u.nombre, u.apellido, u.rol
       FROM sesiones s
       INNER JOIN usuarios u ON u.cedula = s.usuario_cedula
       WHERE s.token_hash = ? AND s.expira_en > NOW() AND u.activo = 1
       LIMIT 1`,
      [tokenHash],
    )
    return rows[0] ?? null
  }

  async deleteByToken(token) {
    const tokenHash = hashToken(token)
    await query('DELETE FROM sesiones WHERE token_hash = ?', [tokenHash])
  }

  async deleteByCedula(cedula) {
    await query('DELETE FROM sesiones WHERE usuario_cedula = ?', [cedula])
  }
}
