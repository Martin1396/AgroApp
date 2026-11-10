export function getVentaMonto(venta) {
  const fromVariedades = (venta?.variedades ?? []).reduce((sum, v) => {
    const pu = Number(v.precioPorUnidad ?? v.precio_por_unidad) || 0
    const tallos = Number(v.tallos) || 0
    return sum + pu * tallos
  }, 0)
  if (fromVariedades > 0) return fromVariedades
  return Number(venta?.precioVenta) || 0
}

export function convertMonto(monto, fromMoneda, toMoneda, tasaUsdCop = 4000) {
  const n = Number(monto) || 0
  const tasa = Number(tasaUsdCop) || 4000
  if (fromMoneda === toMoneda) return n
  if (fromMoneda === 'usd' && toMoneda === 'cop') return n * tasa
  if (fromMoneda === 'cop' && toMoneda === 'usd') return n / tasa
  return n
}

export function computeVentasTotals(ventas, tasaUsdCop = 4000) {
  let totalCop = 0
  let totalUsd = 0
  let totalCopNativo = 0
  let totalUsdNativo = 0
  let ventasCop = 0
  let ventasUsd = 0

  for (const venta of ventas ?? []) {
    const monto = getVentaMonto(venta)
    const moneda = venta.moneda === 'usd' ? 'usd' : 'cop'
    if (moneda === 'usd') {
      ventasUsd += 1
      totalUsdNativo += monto
      totalUsd += monto
      totalCop += convertMonto(monto, 'usd', 'cop', tasaUsdCop)
    } else {
      ventasCop += 1
      totalCopNativo += monto
      totalCop += monto
      totalUsd += convertMonto(monto, 'cop', 'usd', tasaUsdCop)
    }
  }

  return {
    totalCop,
    totalUsd,
    totalCopNativo,
    totalUsdNativo,
    ventasCop,
    ventasUsd,
    cantidadVentas: (ventas ?? []).length,
  }
}

export function groupVentasByCliente(ventas, tasaUsdCop = 4000) {
  const map = new Map()
  for (const venta of ventas ?? []) {
    const nombre = String(venta.cliente || '').trim() || 'Sin comercializadora'
    if (!map.has(nombre)) map.set(nombre, [])
    map.get(nombre).push(venta)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([nombre, items]) => ({
      nombre,
      cantidad: items.length,
      ...computeVentasTotals(items, tasaUsdCop),
    }))
}

export function serializeCierreDetalle(ventas, tasaUsdCop = 4000) {
  return {
    comercializadoras: groupVentasByCliente(ventas, tasaUsdCop),
    ventas: (ventas ?? []).map((venta) => {
      const monto = getVentaMonto(venta)
      const moneda = venta.moneda === 'usd' ? 'usd' : 'cop'
      return {
        id: venta.id,
        sequence: venta.sequence,
        cliente: venta.cliente,
        fecha: venta.createdAt,
        moneda,
        montoOriginal: monto,
        montoCop: moneda === 'cop' ? monto : convertMonto(monto, 'usd', 'cop', tasaUsdCop),
        montoUsd: moneda === 'usd' ? monto : convertMonto(monto, 'cop', 'usd', tasaUsdCop),
      }
    }),
  }
}
