import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const migrations = process.argv.slice(2)
if (!migrations.length) {
  console.error('Uso: node scripts/run-migrations.js <archivo.sql> [...]')
  process.exit(1)
}

const conn = await mysql.createConnection({
  host: process.env.MYSQL_ADDON_HOST,
  port: Number(process.env.MYSQL_ADDON_PORT) || 3306,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  multipleStatements: true,
})

try {
  for (const file of migrations) {
    const full = path.isAbsolute(file) ? file : path.join(__dirname, '..', file)
    const sql = fs.readFileSync(full, 'utf8')
    console.log(`→ ${path.basename(full)}`)
    await conn.query(sql)
    console.log(`  OK`)
  }
  console.log('Migraciones aplicadas.')
} catch (e) {
  console.error('Error:', e.message)
  process.exit(1)
} finally {
  await conn.end()
}
