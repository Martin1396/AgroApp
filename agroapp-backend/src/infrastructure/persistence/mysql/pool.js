import mysql from 'mysql2/promise'
import { env } from '../../../config/env.js'

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: false,
})

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}
