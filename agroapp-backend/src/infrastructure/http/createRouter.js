import { Router } from 'express'
import { DEFAULT_COMPANY } from '../../shared/companyDefaults.js'
import { createAuthMiddleware } from './middleware/authMiddleware.js'

function defaultCompanyPayload() {
  return { ...DEFAULT_COMPANY, colors: { ...DEFAULT_COMPANY.colors } }
}

export function createRouter(deps) {
  const {
    authService,
    sessionRepo,
    userRepo,
    productionRepo,
    salesRepo,
    inventoryRepo,
    companyRepo,
    bitacoraRepo,
    bitacoraComboRepo,
    bitacoraComboCategoriaRepo,
    salesCatalogRepo,
    productionService,
  } = deps

  const router = Router()
  const requireAuth = createAuthMiddleware(authService, sessionRepo)

  const requireAdmin = (req, res, next) => {
    const role = req.user?.role
    if (role === 'administrador' || role === 'desarrollador') return next()
    return res.status(403).json({ error: 'No autorizado' })
  }

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { cedula, password } = req.body
      const result = await authService.login(cedula, password)
      if (!result.ok) return res.status(401).json({ error: result.error })
      res.json({ user: result.user, token: result.token })
    } catch (e) {
      next(e)
    }
  })

  router.post('/auth/register', async (req, res, next) => {
    try {
      const { cedula, nombre, apellido, password, role } = req.body
      const result = await authService.register({ cedula, nombre, apellido, password, role })
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.status(201).json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.post('/auth/logout', requireAuth, async (req, res, next) => {
    try {
      await authService.logout(req.user.token)
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.get('/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })

  router.get('/users/:cedula', requireAuth, async (req, res, next) => {
    try {
      const user = await authService.findUserByCedula(req.params.cedula)
      if (!user) return res.status(404).json({ error: 'No encontrado' })
      res.json({ user })
    } catch (e) {
      next(e)
    }
  })

  router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const rows = await userRepo.listActive()
      const filtered = rows.filter((r) => !authService.isDeveloperCedula(r.cedula))
      const items = await Promise.all(filtered.map((r) => userRepo.toPublicUser(r)))
      // Importante: el perfil "desarrollador" no debe aparecer en el listado.
      res.json({ items })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/users/:cedula', requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const target = String(req.params.cedula ?? '').trim()

      if (!target) return res.status(400).json({ error: 'Cédula inválida' })
      if (authService.isDeveloperCedula(target)) {
        return res.status(400).json({ error: 'No se puede eliminar la cuenta de desarrollador' })
      }
      if (req.user?.cedula === target) {
        return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
      }

      const ok = await userRepo.deactivate(target)
      if (ok) await sessionRepo.deleteByCedula(target)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/users/:cedula/password', requireAuth, async (req, res, next) => {
    try {
      const ok = await authService.updatePassword(req.params.cedula, req.body.password)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/users/:cedula/profile', requireAuth, async (req, res, next) => {
    try {
      const ok = await authService.updateProfile(req.params.cedula, req.body)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.get('/company', async (_req, res) => {
    try {
      const settings = await companyRepo.get()
      res.json({ settings })
    } catch (e) {
      console.error('GET /company:', e.message)
      res.json({ settings: defaultCompanyPayload(), dbUnavailable: true })
    }
  })

  router.put('/company', requireAuth, async (req, res, next) => {
    try {
      const settings = await companyRepo.update(req.body)
      res.json({ settings })
    } catch (e) {
      next(e)
    }
  })

  router.get('/productions', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await productionRepo.findAll() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/productions/active', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await productionRepo.findActive() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/productions/historial', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await productionRepo.findHistorial() })
    } catch (e) {
      next(e)
    }
  })

  router.post('/productions', requireAuth, async (req, res, next) => {
    try {
      const { desdeCama, hastaCama, cantidadPlantas } = req.body
      const conflict = await productionService.findActiveCamasConflict(desdeCama, hastaCama)
      if (conflict) {
        return res.status(409).json({ error: 'Conflicto de camas', conflict })
      }
      const item = await productionRepo.create({ desdeCama, hastaCama, cantidadPlantas })
      res.status(201).json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.post('/productions/:id/cortes', requireAuth, async (req, res, next) => {
    try {
      const cantidad = Number(req.body.cantidad)
      if (!cantidad || cantidad < 1) {
        return res.status(400).json({ error: 'La cantidad de flores es obligatoria' })
      }
      const corte = await productionRepo.addCorte(
        req.params.id,
        cantidad,
        req.body.tallosDesechados,
      )
      if (!corte) return res.status(404).json({ error: 'Producción no encontrada' })
      res.status(201).json({ corte })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/productions/:id/cortes/:corteId', requireAuth, async (req, res, next) => {
    try {
      const ok = await productionRepo.updateCorte(req.params.id, req.params.corteId, req.body)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.post('/productions/:id/finalizar', requireAuth, async (req, res, next) => {
    try {
      const ok = await productionRepo.finalize(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  // Nota: esta ruta debe ir ANTES de /productions/:id para no ser capturada por :id='historial'
  router.delete('/productions/historial', requireAuth, async (_req, res, next) => {
    try {
      await productionRepo.clearHistorial()
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/productions/:id', requireAuth, async (req, res, next) => {
    try {
      const ok = await productionRepo.delete(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await salesRepo.findAll() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales/active', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await salesRepo.findActive() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales/historial', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await salesRepo.findHistorial() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales/reporte', requireAuth, async (_req, res, next) => {
    try {
      const historial = await salesRepo.findHistorial()
      let totalCop = 0
      let totalUsd = 0
      let ventasCop = 0
      let ventasUsd = 0
      historial.forEach((s) => {
        const monto = Number(s.precioVenta) || 0
        if (s.moneda === 'usd') {
          totalUsd += monto
          ventasUsd += 1
        } else {
          totalCop += monto
          ventasCop += 1
        }
      })
      res.json({
        cantidadVentas: historial.length,
        totalCop,
        totalUsd,
        ventasCop,
        ventasUsd,
      })
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales/comercializadoras', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await salesCatalogRepo.findAllComercializadoras() })
    } catch (e) {
      next(e)
    }
  })

  router.post('/sales/comercializadoras', requireAuth, async (req, res, next) => {
    try {
      const result = await salesCatalogRepo.createComercializadora(req.body.nombre)
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  })

  router.delete('/sales/comercializadoras/:id', requireAuth, async (req, res, next) => {
    try {
      const result = await salesCatalogRepo.deleteComercializadora(req.params.id)
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  router.get('/sales/variedades', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await salesCatalogRepo.findAllVariedades() })
    } catch (e) {
      next(e)
    }
  })

  router.post('/sales/variedades', requireAuth, async (req, res, next) => {
    try {
      const result = await salesCatalogRepo.createVariedad(req.body.nombre)
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  })

  router.delete('/sales/variedades/:id', requireAuth, async (req, res, next) => {
    try {
      const result = await salesCatalogRepo.deleteVariedad(req.params.id)
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  router.post('/sales', requireAuth, async (req, res, next) => {
    try {
      const item = await salesRepo.create(req.body)
      res.status(201).json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/sales/:id', requireAuth, async (req, res, next) => {
    try {
      const item = await salesRepo.update(req.params.id, req.body)
      if (!item) return res.status(404).json({ error: 'No encontrada' })
      res.json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.post('/sales/:id/comprobante', requireAuth, async (req, res, next) => {
    try {
      const ok = await salesRepo.attachComprobante(
        req.params.id,
        req.body.dataUrl,
        req.body.fileName,
      )
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.post('/sales/:id/confirmar-pago', requireAuth, async (req, res, next) => {
    try {
      const ok = await salesRepo.confirmarPago(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  // Nota: esta ruta debe ir ANTES de /sales/:id para no ser capturada por :id='historial'
  router.delete('/sales/historial', requireAuth, async (_req, res, next) => {
    try {
      await salesRepo.clearHistorial()
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/sales/:id', requireAuth, async (req, res, next) => {
    try {
      const ok = await salesRepo.delete(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.get('/inventory/productos', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await inventoryRepo.findAllProductos() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/inventory/movimientos', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await inventoryRepo.findAllMovimientos() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/inventory/next-code', requireAuth, async (req, res, next) => {
    try {
      const code = await inventoryRepo.getNextCode(req.query.categoria || 'herramienta')
      res.json({ code })
    } catch (e) {
      next(e)
    }
  })

  router.post('/inventory/productos', requireAuth, async (req, res, next) => {
    try {
      const producto = await inventoryRepo.createProducto(req.body, req.user)
      res.status(201).json({ producto })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/inventory/productos/:id', requireAuth, async (req, res, next) => {
    try {
      const result = await inventoryRepo.updateProducto(req.params.id, req.body)
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  router.delete('/inventory/productos/:id', requireAuth, async (req, res, next) => {
    try {
      const result = await inventoryRepo.deleteProducto(req.params.id)
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  router.post('/inventory/movimientos', requireAuth, async (req, res, next) => {
    try {
      const result = await inventoryRepo.registrarMovimiento({
        ...req.body,
        auditUser: req.user,
      })
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  })

  router.delete('/inventory/all', requireAuth, async (_req, res, next) => {
    try {
      await inventoryRepo.clearAll()
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/data/operational', requireAuth, async (_req, res, next) => {
    try {
      await productionRepo.clearAll()
      await salesRepo.clearAll()
      await inventoryRepo.clearAll()
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.get('/bitacora', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await bitacoraRepo.findAll() })
    } catch (e) {
      next(e)
    }
  })

  router.post('/bitacora', requireAuth, async (req, res, next) => {
    try {
      const { fecha, tipoLabor, ubicacion, proposito, observaciones, productos } = req.body
      if (!fecha?.trim()) return res.status(400).json({ error: 'La fecha es obligatoria' })
      if (!tipoLabor?.trim()) return res.status(400).json({ error: 'El tipo de labor es obligatorio' })
      const item = await bitacoraRepo.create(
        {
          fecha,
          tipoLabor,
          ubicacion,
          proposito: proposito?.trim() || '',
          observaciones,
          productos: productos ?? [],
        },
        req.user,
      )
      res.status(201).json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.get('/bitacora/combo-categorias', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await bitacoraComboCategoriaRepo.findAll() })
    } catch (e) {
      next(e)
    }
  })

  router.post('/bitacora/combo-categorias', requireAuth, async (req, res, next) => {
    try {
      const result = await bitacoraComboCategoriaRepo.create(req.body.nombre)
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.status(201).json({ item: result.item })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/bitacora/combo-categorias/:id', requireAuth, async (req, res, next) => {
    try {
      const result = await bitacoraComboCategoriaRepo.delete(req.params.id)
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  })

  router.get('/bitacora/combos', requireAuth, async (_req, res, next) => {
    try {
      res.json({ items: await bitacoraComboRepo.findAll() })
    } catch (e) {
      next(e)
    }
  })

  router.get('/bitacora/tareas/hoy', requireAuth, async (req, res, next) => {
    try {
      const fecha = req.query.fecha || new Date().toISOString().slice(0, 10)
      const items = await bitacoraComboRepo.getTareasHoy(fecha)
      res.json({ fecha, items })
    } catch (e) {
      next(e)
    }
  })

  router.get('/bitacora/tareas/pendientes', requireAuth, async (req, res, next) => {
    try {
      const hasta = req.query.hasta || new Date().toISOString().slice(0, 10)
      const items = await bitacoraComboRepo.getTareasPendientesConfirmacion(hasta)
      res.json({ items })
    } catch (e) {
      next(e)
    }
  })

  router.post('/bitacora/combos', requireAuth, async (req, res, next) => {
    try {
      const { nombre, descripcion, productos, rondas, categoriaId } = req.body
      if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre del combo es obligatorio' })
      const item = await bitacoraComboRepo.create(
        { nombre, descripcion, productos, rondas, categoriaId },
        req.user,
      )
      res.status(201).json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.patch('/bitacora/combos/:id', requireAuth, async (req, res, next) => {
    try {
      const item = await bitacoraComboRepo.update(req.params.id, req.body)
      if (!item) return res.status(404).json({ error: 'Combo no encontrado' })
      res.json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/bitacora/combos/:id', requireAuth, async (req, res, next) => {
    try {
      const ok = await bitacoraComboRepo.delete(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  router.put('/bitacora/combos/:id/cronograma', requireAuth, async (req, res, next) => {
    try {
      const result = await bitacoraComboRepo.saveCronograma(
        req.params.id,
        req.body.diasSemana ?? [],
      )
      if (!result.ok) return res.status(400).json({ error: result.error })
      const item = await bitacoraComboRepo.findById(req.params.id)
      res.json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.post('/bitacora/combos/:id/completar', requireAuth, async (req, res, next) => {
    try {
      const result = await bitacoraComboRepo.marcarCompletado(
        req.params.id,
        req.body.fecha,
        req.user,
      )
      if (!result.ok) return res.status(400).json({ error: result.error })
      res.json(result)
    } catch (e) {
      next(e)
    }
  })

  router.patch('/bitacora/:id', requireAuth, async (req, res, next) => {
    try {
      const item = await bitacoraRepo.update(req.params.id, req.body)
      if (!item) return res.status(404).json({ error: 'Registro no encontrado' })
      res.json({ item })
    } catch (e) {
      next(e)
    }
  })

  router.delete('/bitacora/:id', requireAuth, async (req, res, next) => {
    try {
      const ok = await bitacoraRepo.delete(req.params.id)
      res.json({ ok })
    } catch (e) {
      next(e)
    }
  })

  return router
}
