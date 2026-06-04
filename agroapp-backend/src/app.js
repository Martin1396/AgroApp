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

/** Crea la app Express con todas las dependencias inyectadas. */
export function buildApp() {
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

  return createApp(router)
}
