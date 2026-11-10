import {
  computeVentasTotals,
  serializeCierreDetalle,
} from '../../shared/salesTotals.js'
import {
  bogotaNowParts,
  formatYearMonthLabel,
  lastCloseableYearMonth,
  nextYearMonth,
  periodEndForMonth,
  ymValue,
} from '../../shared/bogotaDate.js'

function inPeriod(iso, start, end) {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return false
  return t > start.getTime() && t <= end.getTime()
}

export class SalesCierreService {
  constructor(salesRepo, cierreRepo, exchangeRateService) {
    this.salesRepo = salesRepo
    this.cierreRepo = cierreRepo
    this.exchangeRateService = exchangeRateService
  }

  async getTrm() {
    const payload = await this.exchangeRateService.getUsdCopRate()
    return Number(payload?.rate) || 4000
  }

  async createCierreForMonth(anio, mes, tasa, lastCierre) {
    const existing = await this.cierreRepo.findByYearMonth(anio, mes)
    if (existing) return { created: false, cierre: existing }

    const periodoFin = periodEndForMonth(anio, mes)
    const periodoInicio = lastCierre?.periodoFin
      ? new Date(lastCierre.periodoFin)
      : new Date(0)

    const ventas = await this.salesRepo.findAll()
    const delPeriodo = ventas.filter((v) => inPeriod(v.createdAt, periodoInicio, periodoFin))
    const totales = computeVentasTotals(delPeriodo, tasa)
    const detalle = serializeCierreDetalle(delPeriodo, tasa)

    const cierre = await this.cierreRepo.create({
      anio,
      mes,
      periodoInicio,
      periodoFin,
      trm: tasa,
      totalCop: totales.totalCop,
      totalUsd: totales.totalUsd,
      cantidadVentas: totales.cantidadVentas,
      detalle,
    })
    return { created: true, cierre }
  }

  async ensureCierres() {
    const tasa = await this.getTrm()
    const now = bogotaNowParts()
    const target = lastCloseableYearMonth(now)
    let last = await this.cierreRepo.findLatest()
    const created = []

    const monthsToClose = []
    if (!last) {
      if (now.day >= 28) {
        monthsToClose.push({ anio: now.year, mes: now.month })
      }
    } else {
      let cursor = nextYearMonth({ anio: last.anio, mes: last.mes })
      while (ymValue(cursor) <= ymValue(target)) {
        monthsToClose.push(cursor)
        cursor = nextYearMonth(cursor)
      }
    }

    for (const ym of monthsToClose) {
      const result = await this.createCierreForMonth(ym.anio, ym.mes, tasa, last)
      if (result.created) created.push(result.cierre)
      last = result.cierre
    }

    return this.buildEstado(tasa, now, created)
  }

  async buildEstado(tasa, now = bogotaNowParts(), created = []) {
    const cierres = await this.cierreRepo.findAll()
    const ultimoCierre = cierres[0] ?? null
    const ventas = await this.salesRepo.findAll()
    const start = ultimoCierre?.periodoFin ? new Date(ultimoCierre.periodoFin) : new Date(0)
    const end = new Date()
    const delPeriodo = ventas.filter((v) => inPeriod(v.createdAt, start, end))
    const totales = computeVentasTotals(delPeriodo, tasa)
    const porComercializadora = serializeCierreDetalle(delPeriodo, tasa).comercializadoras

    const proximo = now.day >= 28
      ? nextYearMonth({ anio: now.year, mes: now.month })
      : { anio: now.year, mes: now.month }

    const target = lastCloseableYearMonth(now)
    const targetCerrado = Boolean(
      cierres.find((c) => c.anio === target.anio && c.mes === target.mes),
    )

    return {
      trm: tasa,
      cierres,
      ultimoCierre,
      created,
      periodoActual: {
        desde: ultimoCierre?.periodoFin ?? null,
        hasta: end.toISOString(),
        ...totales,
        comercializadoras: porComercializadora,
      },
      proximoCierre: {
        anio: proximo.anio,
        mes: proximo.mes,
        fecha: `${proximo.anio}-${String(proximo.mes).padStart(2, '0')}-28`,
        etiqueta: formatYearMonthLabel(proximo.anio, proximo.mes),
      },
      ultimoCierreEtiqueta: ultimoCierre
        ? formatYearMonthLabel(ultimoCierre.anio, ultimoCierre.mes)
        : null,
      cerradoHasta: targetCerrado
        ? formatYearMonthLabel(target.anio, target.mes)
        : null,
    }
  }
}
