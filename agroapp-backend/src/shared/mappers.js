import { DEFAULT_COMPANY } from './companyDefaults.js'

/** Convierte filas MySQL (snake_case) a contrato del frontend (camelCase) */

export function mapUserRow(row) {
  if (!row) return null
  return {
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    role: row.rol === 'administrador' ? 'administrador' : 'trabajador',
  }
}

export function mapProductionRow(row, cortes = []) {
  return {
    id: row.id,
    sequence: row.secuencia,
    code: row.codigo,
    desdeCama: row.desde_cama,
    hastaCama: row.hasta_cama,
    cantidadPlantas: row.cantidad_plantas,
    cortes: cortes.map(mapCorteRow),
    finalizada: Boolean(row.finalizada),
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
    fechaFinalizacion: row.fecha_finalizacion
      ? row.fecha_finalizacion instanceof Date
        ? row.fecha_finalizacion.toISOString()
        : row.fecha_finalizacion
      : null,
  }
}

export function mapCorteRow(row) {
  return {
    id: row.id,
    sequence: row.secuencia,
    cantidad: row.cantidad,
    fecha: row.fecha instanceof Date ? row.fecha.toISOString() : row.fecha,
  }
}

export function mapVentaRow(row, variedades = []) {
  return {
    id: row.id,
    sequence: row.secuencia,
    cliente: row.cliente,
    tipoFlor: row.tipo_flor,
    moneda: row.moneda,
    variedades: variedades.map(mapVariedadRow),
    precioVenta: Number(row.precio_venta),
    productionId: row.produccion_id,
    productionLabel: row.produccion_etiqueta,
    comprobantePago: row.comprobante_pago,
    comprobanteNombre: row.comprobante_nombre || '',
    pagoConfirmado: Boolean(row.pago_confirmado),
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
    fechaPagoConfirmado: row.fecha_pago_confirmado
      ? row.fecha_pago_confirmado instanceof Date
        ? row.fecha_pago_confirmado.toISOString()
        : row.fecha_pago_confirmado
      : null,
  }
}

export function mapVariedadRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    tallos: row.tallos,
    precioPorUnidad: Number(row.precio_por_unidad),
  }
}

export function mapProductoRow(row) {
  return {
    id: row.id,
    code: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    unidad: row.unidad,
    stock: row.stock,
    descripcion: row.descripcion || '',
    createdAt: row.creado_en instanceof Date ? row.creado_en.toISOString() : row.creado_en,
    creadoPor: {
      nombre: row.creado_por_nombre || '',
      cedula: row.creado_por_cedula || '',
      role: row.creado_por_rol || '',
    },
  }
}

export function mapMovimientoRow(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    productoId: row.producto_id,
    productoNombre: row.producto_nombre,
    productoCode: row.producto_codigo,
    categoria: row.categoria,
    cantidad: row.cantidad,
    unidad: row.unidad,
    stockResultante: row.stock_resultante,
    nota: row.nota || '',
    fecha: row.fecha instanceof Date ? row.fecha.toISOString() : row.fecha,
    usuario: {
      nombre: row.usuario_nombre || 'Usuario',
      cedula: row.usuario_cedula || '',
      role: row.usuario_rol || '',
    },
  }
}

export function mapCompanyRow(row) {
  if (!row) {
    return {
      ...DEFAULT_COMPANY,
      colors: { ...DEFAULT_COMPANY.colors },
    }
  }
  return {
    namePrimary: row.nombre_principal,
    nameSecondary: row.nombre_secundario,
    namePrimaryColor: row.color_nombre_principal,
    nameSecondaryColor: row.color_nombre_secundario,
    nameFontSizeScale: Number(row.escala_nombre) || DEFAULT_COMPANY.nameFontSizeScale,
    logoSizeScale: Number(row.escala_logo) || DEFAULT_COMPANY.logoSizeScale,
    tagline: row.eslogan,
    logoMain: row.logo_principal || DEFAULT_COMPANY.logoMain,
    logoSidebar: row.logo_sidebar || DEFAULT_COMPANY.logoSidebar,
    colors: {
      greenDark: row.color_verde_oscuro,
      greenMid: row.color_verde_medio,
      greenLight: row.color_verde_claro,
      gold: row.color_dorado,
      goldLight: row.color_dorado_claro,
      goldDark: row.color_dorado_oscuro,
      bgCream: row.color_fondo_crema,
      bgPageTop: row.color_fondo_superior,
      bgWhite: row.color_fondo_tarjetas,
      textDark: row.color_texto_principal,
      textMuted: row.color_texto_secundario,
      borderLight: row.color_bordes,
    },
  }
}
