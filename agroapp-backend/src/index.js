import express from 'express'
import { buildApp } from './app.js'
import { env } from './config/env.js'
import { pool } from './infrastructure/persistence/mysql/pool.js'

const app = buildApp()
app.set('trust proxy', 1)
export default app

async function start() {
  try {
    await pool.query('SELECT 1')
    console.log('MySQL conectado')
  } catch (err) {
    console.warn('Advertencia: no se pudo conectar a MySQL:', err.message)
    console.warn('Configura MYSQL_ADDON_* en .env (Clever Cloud)')
  }

  app.listen(env.port, () => {
    console.log(`AgroApp API en http://localhost:${env.port}`)
  })
}

if (!process.env.VERCEL) {
  start()
}
