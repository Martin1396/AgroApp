import { env } from './config/env.js'
import { AuthService } from './application/services/AuthService.js'
import { ProductionService } from './application/services/ProductionService.js'
import { UserRepositoryMysql } from './infrastructure/persistence/mysql/UserRepositoryMysql.js'
import { SessionRepositoryMysql } from './infrastructure/persistence/mysql/SessionRepositoryMysql.js'
import { ProductionRepositoryMysql } from './infrastructure/persistence/mysql/ProductionRepositoryMysql.js'
import { SalesRepositoryMysql } from './infrastructure/persistence/mysql/SalesRepositoryMysql.js'
import { InventoryRepositoryMysql } from './infrastructure/persistence/mysql/InventoryRepositoryMysql.js'
import { CompanyRepositoryMysql } from './infrastructure/persistence/mysql/CompanyRepositoryMysql.js'
import { createRouter } from './infrastructure/http/createRouter.js'
import { createApp } from './infrastructure/http/createApp.js'
import { pool } from './infrastructure/persistence/mysql/pool.js'

const userRepo = new UserRepositoryMysql()
const sessionRepo = new SessionRepositoryMysql()
const productionRepo = new ProductionRepositoryMysql()
const salesRepo = new SalesRepositoryMysql()
const inventoryRepo = new InventoryRepositoryMysql()
const companyRepo = new CompanyRepositoryMysql()

const authService = new AuthService(userRepo, sessionRepo)
const productionService = new ProductionService(productionRepo)

const router = createRouter({
  authService,
  sessionRepo,
  userRepo,
  productionRepo,
  salesRepo,
  inventoryRepo,
  companyRepo,
  productionService,
})

const app = createApp(router)

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

start()
