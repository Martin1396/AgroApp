import { apiRequest } from '../api/client'
import { buildDisplayName, getSession } from './session'

export const CATEGORIA = {
  HERRAMIENTA: 'herramienta',
  QUIMICO: 'quimico',
  ABONO: 'abono',
}

export const CATEGORIA_LABELS = {
  [CATEGORIA.HERRAMIENTA]: 'Herramientas',
  [CATEGORIA.QUIMICO]: 'Químicos',
  [CATEGORIA.ABONO]: 'Abonos',
}

export const TIPO_MOVIMIENTO = {
  INGRESO: 'ingreso',
  SALIDA: 'salida',
}

export const CATEGORIA_ORDER = [CATEGORIA.QUIMICO, CATEGORIA.ABONO, CATEGORIA.HERRAMIENTA]

export const CATEGORIA_CODE_PREFIX = {
  [CATEGORIA.QUIMICO]: 'Q',
  [CATEGORIA.ABONO]: 'A',
  [CATEGORIA.HERRAMIENTA]: 'H',
}

function getAuditUser() {
  const s = getSession()
  if (!s) {
    return { nombre: 'Usuario', cedula: '', role: 'trabajador' }
  }
  return {
    nombre: buildDisplayName(s),
    cedula: s.cedula ?? '',
    role: s.role ?? 'trabajador',
  }
}

export async function getNextProductCode(categoria = CATEGORIA.HERRAMIENTA) {
  const { code } = await apiRequest(
    `/inventory/next-code?categoria=${encodeURIComponent(categoria)}`,
  )
  return code
}

export function compareProductCodes(a, b) {
  const parse = (code) => {
    const str = String(code || '').trim().toUpperCase()
    const m = str.match(/^([QAH])(\d+)$/)
    return m ? Number(m[2]) : 0
  }
  return parse(a) - parse(b)
}

export async function getProductos() {
  const { items } = await apiRequest('/inventory/productos')
  return items
}

export async function getProductosAgrupados() {
  const productos = await getProductos()
  return CATEGORIA_ORDER.map((categoria) => ({
    categoria,
    label: CATEGORIA_LABELS[categoria],
    items: productos.filter((p) => p.categoria === categoria),
  })).filter((g) => g.items.length > 0)
}

export async function getMovimientos() {
  const { items } = await apiRequest('/inventory/movimientos')
  return items
}

export async function getProductosByCategoria(categoria) {
  const list = await getProductos()
  if (!categoria) return list
  return list.filter((p) => p.categoria === categoria)
}

export async function findProductoByCode(codeInput) {
  const target = String(codeInput ?? '').trim().toUpperCase()
  if (!target) return null
  const list = await getProductos()
  return list.find((p) => String(p.code).toUpperCase() === target) ?? null
}

export async function addProducto(data) {
  const { producto } = await apiRequest('/inventory/productos', {
    method: 'POST',
    body: {
      nombre: data.nombre,
      categoria: data.categoria,
      unidad: data.unidad || 'unidad',
      stockInicial: data.stockInicial || 0,
      descripcion: data.descripcion || '',
    },
  })
  return producto
}

export async function addProductoInventario({ nombre, categoria, cantidad, descripcion = '' }) {
  if (!nombre?.trim()) return { ok: false, error: 'Ingresa el nombre del producto' }
  if (Number(cantidad) < 1) return { ok: false, error: 'Ingresa la cantidad' }

  const producto = await addProducto({
    nombre,
    categoria,
    stockInicial: Number(cantidad),
    descripcion,
  })

  return { ok: true, producto }
}

export async function deleteProducto(productoId) {
  return apiRequest(`/inventory/productos/${productoId}`, { method: 'DELETE' })
}

export async function registrarIngreso(payload) {
  return registrarMovimiento({ ...payload, tipo: TIPO_MOVIMIENTO.INGRESO })
}

export async function registrarIngresoProductoNuevo(data) {
  const qty = Number(data.cantidad)
  if (!data.nombre?.trim()) return { ok: false, error: 'Ingresa el nombre del producto' }
  if (!data.unidad?.trim()) return { ok: false, error: 'Ingresa la unidad de medida' }
  if (qty <= 0) return { ok: false, error: 'Ingresa una cantidad válida' }

  const producto = await addProducto({
    nombre: data.nombre,
    categoria: data.categoria,
    unidad: data.unidad,
    stockInicial: 0,
  })

  return registrarIngreso({ productoId: producto.id, cantidad: qty, nota: data.nota })
}

export async function registrarSalida(payload) {
  return registrarMovimiento({ ...payload, tipo: TIPO_MOVIMIENTO.SALIDA })
}

async function registrarMovimiento({ productoId, cantidad, tipo, nota }) {
  try {
    return await apiRequest('/inventory/movimientos', {
      method: 'POST',
      body: { productoId, cantidad, tipo, nota },
    })
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

export async function getMovimientosByTipo(tipo) {
  const list = await getMovimientos()
  return list.filter((m) => m.tipo === tipo)
}

export async function getHistorialMovimientos() {
  return getMovimientos()
}

export async function clearAllInventario() {
  await apiRequest('/inventory/all', { method: 'DELETE' })
  return true
}

export function formatFechaInventario(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// expuesto para auditoría en UI si se necesita
export { getAuditUser }
