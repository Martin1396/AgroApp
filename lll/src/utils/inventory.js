import { buildDisplayName, getSession } from './session'

const PRODUCTS_KEY = 'turpial_inventario_productos'
const MOVEMENTS_KEY = 'turpial_inventario_movimientos'

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

export const CATEGORIA_ORDER = [CATEGORIA.QUIMICO, CATEGORIA.ABONO, CATEGORIA.HERRAMIENTA]

export const CATEGORIA_CODE_PREFIX = {
  [CATEGORIA.QUIMICO]: 'Q',
  [CATEGORIA.ABONO]: 'A',
  [CATEGORIA.HERRAMIENTA]: 'H',
}

function parseCategoryCodeNumber(code) {
  const str = String(code || '').trim().toUpperCase()
  const match = str.match(/^([QAH])(\d+)$/)
  if (match) return Number(match[2])
  const legacy = str.match(/^(\d+)$/)
  if (legacy) return Number(legacy[1])
  const invMatch = str.match(/^INV-(\d+)$/)
  if (invMatch) return Number(invMatch[1])
  return 0
}

function formatProductCode(categoria, n) {
  const prefix = CATEGORIA_CODE_PREFIX[categoria] ?? CATEGORIA_CODE_PREFIX[CATEGORIA.HERRAMIENTA]
  return `${prefix}${n}`
}

function normalizeCodeInput(raw) {
  return String(raw ?? '').trim().toUpperCase()
}

function needsCodeMigration(list) {
  return list.some((p) => {
    const cat = Object.values(CATEGORIA).includes(p.categoria) ? p.categoria : CATEGORIA.HERRAMIENTA
    const expectedPrefix = CATEGORIA_CODE_PREFIX[cat]
    const code = normalizeCodeInput(p.code)
    return !new RegExp(`^${expectedPrefix}\\d+$`).test(code)
  })
}

function renumberProductCodes(list) {
  CATEGORIA_ORDER.forEach((categoria) => {
    const inCategory = list
      .filter((p) => {
        const cat = Object.values(CATEGORIA).includes(p.categoria) ? p.categoria : CATEGORIA.HERRAMIENTA
        return cat === categoria
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    inCategory.forEach((p, i) => {
      p.code = formatProductCode(categoria, i + 1)
    })
  })
  return list
}

function normalizeProduct(p, index = 0) {
  const cat = Object.values(CATEGORIA).includes(p.categoria) ? p.categoria : CATEGORIA.HERRAMIENTA
  const code = p.code ? normalizeCodeInput(p.code) : formatProductCode(cat, index + 1)
  return {
    ...p,
    code,
    categoria: cat,
    stock: Number(p.stock) || 0,
    unidad: String(p.unidad || 'unidad').trim() || 'unidad',
    descripcion: String(p.descripcion || '').trim(),
  }
}

export function getNextProductCode(categoria = CATEGORIA.HERRAMIENTA) {
  const cat = Object.values(CATEGORIA).includes(categoria) ? categoria : CATEGORIA.HERRAMIENTA
  const prefix = CATEGORIA_CODE_PREFIX[cat]
  const inCategory = getProductosRaw().filter((p) => {
    const pCat = Object.values(CATEGORIA).includes(p.categoria) ? p.categoria : CATEGORIA.HERRAMIENTA
    return pCat === cat
  })
  if (inCategory.length === 0) return `${prefix}1`
  const maxNum = Math.max(...inCategory.map((p) => parseCategoryCodeNumber(p.code)), 0)
  return `${prefix}${maxNum + 1}`
}

export function compareProductCodes(a, b) {
  return parseCategoryCodeNumber(a?.code) - parseCategoryCodeNumber(b?.code)
}

function getProductosRaw() {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function normalizeMovement(m) {
  return {
    ...m,
    cantidad: Number(m.cantidad) || 0,
    usuario: m.usuario ?? { nombre: 'Usuario', cedula: '', role: '' },
  }
}

export function getProductos() {
  try {
    let list = getProductosRaw()
    if (needsCodeMigration(list)) {
      list = renumberProductCodes([...list])
      saveProductos(list)
    }
    return list.map((p, i) => normalizeProduct(p, i))
  } catch {
    return []
  }
}

export function getProductosAgrupados() {
  const productos = getProductos()
  return CATEGORIA_ORDER.map((categoria) => ({
    categoria,
    label: CATEGORIA_LABELS[categoria],
    items: productos.filter((p) => p.categoria === categoria),
  })).filter((g) => g.items.length > 0)
}

function saveProductos(list) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list))
}

export function getMovimientos() {
  try {
    const data = localStorage.getItem(MOVEMENTS_KEY)
    const list = data ? JSON.parse(data) : []
    return list.map(normalizeMovement).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  } catch {
    return []
  }
}

function saveMovimientos(list) {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(list))
}

export function getProductosByCategoria(categoria) {
  const list = getProductos()
  if (!categoria) return list
  return list.filter((p) => p.categoria === categoria)
}

export function findProductoByCode(codeInput) {
  const target = normalizeCodeInput(codeInput)
  if (!target) return null
  return getProductos().find((p) => normalizeCodeInput(p.code) === target) ?? null
}

export function addProducto({
  nombre,
  categoria,
  unidad = 'unidad',
  stockInicial = 0,
  descripcion = '',
}) {
  const list = getProductosRaw()
  const entry = {
    id: crypto.randomUUID?.() ?? `prod-${Date.now()}`,
    code: getNextProductCode(categoria),
    nombre: nombre.trim(),
    categoria,
    unidad: unidad.trim() || 'unidad',
    stock: Number(stockInicial) || 0,
    descripcion: String(descripcion || '').trim(),
    createdAt: new Date().toISOString(),
    creadoPor: getAuditUser(),
  }
  list.push(entry)
  saveProductos(renumberProductCodes(list))
  return entry
}

export function addProductoInventario({ nombre, categoria, cantidad, descripcion = '' }) {
  if (!nombre?.trim()) return { ok: false, error: 'Ingresa el nombre del producto' }
  if (Number(cantidad) < 1) return { ok: false, error: 'Ingresa la cantidad' }

  const producto = addProducto({
    nombre,
    categoria,
    stockInicial: Number(cantidad),
    descripcion,
  })

  return { ok: true, producto }
}

export function deleteProducto(productoId) {
  const list = getProductosRaw()
  const next = list.filter((p) => p.id !== productoId)
  if (next.length === list.length) return false
  saveProductos(renumberProductCodes(next))
  return true
}

export function registrarIngreso({ productoId, cantidad, nota = '' }) {
  return registrarMovimiento({ productoId, cantidad, tipo: TIPO_MOVIMIENTO.INGRESO, nota })
}

export function registrarIngresoProductoNuevo({ nombre, categoria, unidad, cantidad, nota = '' }) {
  const qty = Number(cantidad)
  if (!nombre?.trim()) return { ok: false, error: 'Ingresa el nombre del producto' }
  if (!unidad?.trim()) return { ok: false, error: 'Ingresa la unidad de medida' }
  if (qty <= 0) return { ok: false, error: 'Ingresa una cantidad válida' }

  const producto = addProducto({
    nombre,
    categoria,
    unidad,
    stockInicial: 0,
  })

  return registrarIngreso({ productoId: producto.id, cantidad: qty, nota })
}

export function registrarSalida({ productoId, cantidad, nota = '' }) {
  return registrarMovimiento({ productoId, cantidad, tipo: TIPO_MOVIMIENTO.SALIDA, nota })
}

function registrarMovimiento({ productoId, cantidad, tipo, nota }) {
  const qty = Number(cantidad)
  if (!productoId || qty <= 0) return { ok: false, error: 'Datos inválidos' }

  const productos = getProductosRaw()
  const index = productos.findIndex((p) => p.id === productoId)
  if (index < 0) return { ok: false, error: 'Producto no encontrado' }

  const producto = normalizeProduct(productos[index], index)
  if (tipo === TIPO_MOVIMIENTO.SALIDA && producto.stock < qty) {
    return { ok: false, error: 'Stock insuficiente' }
  }

  const nuevoStock =
    tipo === TIPO_MOVIMIENTO.INGRESO ? producto.stock + qty : producto.stock - qty

  productos[index] = { ...producto, stock: nuevoStock }
  saveProductos(productos)

  const movimiento = {
    id: crypto.randomUUID?.() ?? `mov-${Date.now()}`,
    tipo,
    productoId,
    productoNombre: producto.nombre,
    productoCode: producto.code,
    categoria: producto.categoria,
    cantidad: qty,
    unidad: producto.unidad,
    stockResultante: nuevoStock,
    nota: nota.trim(),
    fecha: new Date().toISOString(),
    usuario: getAuditUser(),
  }

  const movimientos = getMovimientos()
  movimientos.unshift(movimiento)
  saveMovimientos(movimientos)

  return { ok: true, movimiento }
}

export function getMovimientosByTipo(tipo) {
  return getMovimientos().filter((m) => m.tipo === tipo)
}

export function getHistorialMovimientos() {
  return getMovimientos()
}

export function clearAllInventario() {
  saveProductos([])
  saveMovimientos([])
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
