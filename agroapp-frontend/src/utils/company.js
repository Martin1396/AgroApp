import { apiRequest } from '../api/client'

/** Rutas públicas (misma convención que la API / empresa_config). */
const DEFAULT_LOGO_MAIN = '/logo-turpial.png'
const DEFAULT_LOGO_SIDEBAR = '/logo-turpial-sidebar.png'

export function resolveAssetUrl(src) {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//i.test(src)) {
    return src
  }

  if (src.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${src.slice(1)}`
  }

  if (src.startsWith('./') || src.startsWith('../')) {
    return src
  }

  return `${import.meta.env.BASE_URL}${src}`
}

/** Título fijo de la pestaña del navegador (no depende de la BD). */
export const APP_TAB_TITLE = 'AgroApp'

/** Valores por defecto de marca (debe coincidir con empresa_config y :root en index.css). */
export const DEFAULT_COMPANY = {
  namePrimary: 'AGRO',
  nameSecondary: 'APP',
  namePrimaryColor: '#1a1a1a',
  nameSecondaryColor: '#d4a843',
  nameFontSizeScale: 100,
  logoSizeScale: 100,
  tagline: 'GESTIÓN AGRÍCOLA INTELIGENTE',
  logoMain: DEFAULT_LOGO_MAIN,
  logoSidebar: DEFAULT_LOGO_SIDEBAR,
  colors: {
    greenDark: '#1a3d2e',
    greenMid: '#2d5a45',
    greenLight: '#3d7a5c',
    gold: '#d4a843',
    goldLight: '#e8c468',
    goldDark: '#b8922f',
    bgCream: '#f5f0e6',
    bgPageTop: '#f8f6f0',
    bgWhite: '#fafaf8',
    textDark: '#1a2e24',
    textMuted: '#6b7c72',
    borderLight: '#d8e0da',
  },
}

export const COLOR_FIELDS = [
  { key: 'greenDark', label: 'Verde oscuro (principal)' },
  { key: 'greenMid', label: 'Verde medio' },
  { key: 'greenLight', label: 'Verde claro' },
  { key: 'gold', label: 'Dorado principal' },
  { key: 'goldLight', label: 'Dorado claro' },
  { key: 'goldDark', label: 'Dorado oscuro' },
  { key: 'bgCream', label: 'Fondo crema / beige' },
  { key: 'bgPageTop', label: 'Fondo superior de página' },
  { key: 'bgWhite', label: 'Fondo de tarjetas' },
  { key: 'textDark', label: 'Texto principal' },
  { key: 'textMuted', label: 'Texto secundario' },
  { key: 'borderLight', label: 'Bordes' },
]

let cachedSettings = null
let loadCompanyPromise = null

function normalizeSettings(settings) {
  if (!settings) {
    return { ...DEFAULT_COMPANY, colors: { ...DEFAULT_COMPANY.colors } }
  }
  return {
    ...DEFAULT_COMPANY,
    ...settings,
    logoMain: resolveAssetUrl(settings.logoMain ?? DEFAULT_COMPANY.logoMain),
    logoSidebar: resolveAssetUrl(settings.logoSidebar ?? DEFAULT_COMPANY.logoSidebar),
    colors: { ...DEFAULT_COMPANY.colors, ...settings.colors },
    nameFontSizeScale: Number(settings.nameFontSizeScale) || DEFAULT_COMPANY.nameFontSizeScale,
    logoSizeScale: Number(settings.logoSizeScale) || DEFAULT_COMPANY.logoSizeScale,
  }
}

export function getCompanySettings() {
  if (cachedSettings) return cachedSettings
  return { ...DEFAULT_COMPANY, colors: { ...DEFAULT_COMPANY.colors } }
}

export async function loadCompanySettings() {
  if (cachedSettings) return cachedSettings
  if (loadCompanyPromise) return loadCompanyPromise

  loadCompanyPromise = (async () => {
    try {
      const { settings } = await apiRequest('/company')
      cachedSettings = normalizeSettings(settings)
      return cachedSettings
    } catch {
      cachedSettings = normalizeSettings(null)
      return cachedSettings
    } finally {
      loadCompanyPromise = null
    }
  })()

  return loadCompanyPromise
}

export async function saveCompanySettings(settings) {
  const normalized = {
    ...settings,
    logoMain: settings.logoMain,
    logoSidebar: settings.logoSidebar,
  }
  const { settings: saved } = await apiRequest('/company', {
    method: 'PUT',
    body: normalized,
  })
  cachedSettings = normalizeSettings(saved)
  return cachedSettings
}

export function getFullCompanyName(settings = getCompanySettings()) {
  const parts = [settings.namePrimary, settings.nameSecondary]
    .map((s) => (s || '').trim())
    .filter(Boolean)
  return parts.join(' ') || 'Empresa'
}

export function applyCompanyTheme(settings) {
  const c = settings.colors
  const root = document.documentElement

  const hexToRgb = (hex) => {
    const h = hex.replace('#', '')
    const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
    const n = parseInt(full, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }

  const [r, g, b] = hexToRgb(c.greenDark)
  const [mr, mg, mb] = hexToRgb(c.greenMid)
  const [gr, gg, gb] = hexToRgb(c.gold)
  const [glr, glg, glb] = hexToRgb(c.goldLight)

  root.style.setProperty('--green-dark', c.greenDark)
  root.style.setProperty('--green-mid', c.greenMid)
  root.style.setProperty('--green-light', c.greenLight)
  root.style.setProperty('--gold', c.gold)
  root.style.setProperty('--gold-light', c.goldLight)
  root.style.setProperty('--gold-dark', c.goldDark)
  root.style.setProperty('--bg-cream', c.bgCream)
  root.style.setProperty('--bg-page-top', c.bgPageTop)
  root.style.setProperty('--bg-white', c.bgWhite)
  root.style.setProperty('--text-dark', c.textDark)
  root.style.setProperty('--text-muted', c.textMuted)
  root.style.setProperty('--border-light', c.borderLight)
  root.style.setProperty('--green-dark-rgb', `${r}, ${g}, ${b}`)
  root.style.setProperty('--green-mid-rgb', `${mr}, ${mg}, ${mb}`)
  root.style.setProperty('--gold-rgb', `${gr}, ${gg}, ${gb}`)
  root.style.setProperty('--gold-light-rgb', `${glr}, ${glg}, ${glb}`)
  root.style.setProperty('--shadow-card', `0 8px 40px rgba(${r}, ${g}, ${b}, 0.12)`)
  root.style.setProperty('--brand-name-primary', settings.namePrimaryColor || c.greenDark)
  root.style.setProperty('--brand-name-secondary', settings.nameSecondaryColor || c.gold)
  root.style.setProperty(
    '--brand-name-font-scale',
    String((Number(settings.nameFontSizeScale) || 100) / 100),
  )
  root.style.setProperty(
    '--brand-logo-scale',
    String((Number(settings.logoSizeScale) || 100) / 100),
  )

  document.title = APP_TAB_TITLE

  let icon = document.querySelector('link[rel="icon"]')
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    document.head.appendChild(icon)
  }
  icon.href = resolveAssetUrl(settings.logoMain)
}
