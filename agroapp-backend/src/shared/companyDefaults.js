/** Valores por defecto de marca AgroApp (configuración oficial de la empresa). */

export const DEFAULT_COMPANY = {
  namePrimary: 'AGRO',
  nameSecondary: 'APP',
  namePrimaryColor: '#1a1a1a',
  nameSecondaryColor: '#d4a843',
  nameFontSizeScale: 100,
  logoSizeScale: 100,
  tagline: 'GESTIÓN AGRÍCOLA INTELIGENTE',
  logoMain: '/logo-turpial.png',
  logoSidebar: '/logo-turpial-sidebar.png',
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

export function defaultCompanyDbRow() {
  const d = DEFAULT_COMPANY
  const c = d.colors
  return {
    nombre_principal: d.namePrimary,
    nombre_secundario: d.nameSecondary,
    color_nombre_principal: d.namePrimaryColor,
    color_nombre_secundario: d.nameSecondaryColor,
    eslogan: d.tagline,
    logo_principal: d.logoMain,
    logo_sidebar: d.logoSidebar,
    escala_nombre: d.nameFontSizeScale,
    escala_logo: d.logoSizeScale,
    color_verde_oscuro: c.greenDark,
    color_verde_medio: c.greenMid,
    color_verde_claro: c.greenLight,
    color_dorado: c.gold,
    color_dorado_claro: c.goldLight,
    color_dorado_oscuro: c.goldDark,
    color_fondo_crema: c.bgCream,
    color_fondo_superior: c.bgPageTop,
    color_fondo_tarjetas: c.bgWhite,
    color_texto_principal: c.textDark,
    color_texto_secundario: c.textMuted,
    color_bordes: c.borderLight,
  }
}
