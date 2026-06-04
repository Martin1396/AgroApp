import mysql from 'mysql2/promise'
import { env } from '../../../config/env.js'

/** Clever Cloud suele limitar max_user_connections a 5; en Vercel cada instancia crea su pool. */
const connectionLimit = Number(process.env.MYSQL_POOL_LIMIT) || (process.env.VERCEL ? 1 : 4)

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  waitForConnections: true,
  connectionLimit,
  maxIdle: connectionLimit,
  idleTimeout: 10_000,
  charset: 'utf8mb4',
  dateStrings: false,
})

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}
