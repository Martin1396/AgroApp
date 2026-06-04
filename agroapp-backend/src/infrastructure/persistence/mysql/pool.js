import mysql from 'mysql2/promise'
import { env } from '../../../config/env.js'

const dbConfig = {
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  charset: 'utf8mb4',
  dateStrings: false,
}

/**
 * En Vercel (serverless) cada pool abierto consume una conexión del límite (5 en Clever Cloud).
 * Una conexión por consulta que se cierra al terminar libera el cupo de inmediato.
 */
const usePerRequest =
  process.env.MYSQL_PER_REQUEST === 'true' || Boolean(process.env.VERCEL)

const connectionLimit = Number(process.env.MYSQL_POOL_LIMIT) || 4

export const pool = usePerRequest
  ? null
  : mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit,
      maxIdle: connectionLimit,
      idleTimeout: 10_000,
    })

/** Serializa consultas en la misma instancia serverless (evita picos > max_user_connections). */
let queryChain = Promise.resolve()

function withQueryLock(fn) {
  const run = queryChain.then(fn)
  queryChain = run.catch(() => {})
  return run
}

async function runQuery(sql, params) {
  if (usePerRequest) {
    const conn = await mysql.createConnection(dbConfig)
    try {
      const [rows] = await conn.execute(sql, params)
      return rows
    } finally {
      await conn.end()
    }
  }

  const [rows] = await pool.execute(sql, params)
  return rows
}

export async function query(sql, params = []) {
  return withQueryLock(() => runQuery(sql, params))
}

export async function pingDb() {
  return withQueryLock(async () => {
    if (usePerRequest) {
      const conn = await mysql.createConnection(dbConfig)
      try {
        await conn.query('SELECT 1')
      } finally {
        await conn.end()
      }
      return
    }

    await pool.query('SELECT 1')
  })
}

export function isTooManyConnectionsError(err) {
  const msg = String(err?.message || err?.code || '')
  return msg.includes('max_user_connections') || err?.code === 'ER_TOO_MANY_USER_CONNECTIONS'
}
