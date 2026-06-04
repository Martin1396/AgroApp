import { defaultCompanyDbRow, DEFAULT_COMPANY } from '../../../shared/companyDefaults.js'
import { mapCompanyRow } from '../../../shared/mappers.js'
import { query } from './pool.js'

export class CompanyRepositoryMysql {
  async get() {
    const rows = await query('SELECT * FROM empresa_config WHERE id = 1 LIMIT 1')
    if (!rows[0]) {
      await this.ensureDefaults()
      const inserted = await query('SELECT * FROM empresa_config WHERE id = 1 LIMIT 1')
      return mapCompanyRow(inserted[0])
    }
    return mapCompanyRow(rows[0])
  }

  async ensureDefaults() {
    const d = defaultCompanyDbRow()
    await query(
      `INSERT INTO empresa_config (
        id,
        nombre_principal,
        nombre_secundario,
        color_nombre_principal,
        color_nombre_secundario,
        escala_nombre,
        escala_logo,
        eslogan,
        logo_principal,
        logo_sidebar,
        color_verde_oscuro,
        color_verde_medio,
        color_verde_claro,
        color_dorado,
        color_dorado_claro,
        color_dorado_oscuro,
        color_fondo_crema,
        color_fondo_superior,
        color_fondo_tarjetas,
        color_texto_principal,
        color_texto_secundario,
        color_bordes
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id = id`,
      [
        d.nombre_principal,
        d.nombre_secundario,
        d.color_nombre_principal,
        d.color_nombre_secundario,
        d.escala_nombre,
        d.escala_logo,
        d.eslogan,
        d.logo_principal,
        d.logo_sidebar,
        d.color_verde_oscuro,
        d.color_verde_medio,
        d.color_verde_claro,
        d.color_dorado,
        d.color_dorado_claro,
        d.color_dorado_oscuro,
        d.color_fondo_crema,
        d.color_fondo_superior,
        d.color_fondo_tarjetas,
        d.color_texto_principal,
        d.color_texto_secundario,
        d.color_bordes,
      ],
    )
  }

  async update(settings) {
    const c = settings.colors || {}
    await query(
      `UPDATE empresa_config SET
        nombre_principal = ?,
        nombre_secundario = ?,
        color_nombre_principal = ?,
        color_nombre_secundario = ?,
        escala_nombre = ?,
        escala_logo = ?,
        eslogan = ?,
        logo_principal = ?,
        logo_sidebar = ?,
        color_verde_oscuro = ?,
        color_verde_medio = ?,
        color_verde_claro = ?,
        color_dorado = ?,
        color_dorado_claro = ?,
        color_dorado_oscuro = ?,
        color_fondo_crema = ?,
        color_fondo_superior = ?,
        color_fondo_tarjetas = ?,
        color_texto_principal = ?,
        color_texto_secundario = ?,
        color_bordes = ?
       WHERE id = 1`,
      [
        settings.namePrimary,
        settings.nameSecondary,
        settings.namePrimaryColor,
        settings.nameSecondaryColor,
        Number(settings.nameFontSizeScale) || DEFAULT_COMPANY.nameFontSizeScale,
        Number(settings.logoSizeScale) || DEFAULT_COMPANY.logoSizeScale,
        settings.tagline,
        settings.logoMain?.startsWith('data:') ? settings.logoMain : settings.logoMain,
        settings.logoSidebar?.startsWith('data:') ? settings.logoSidebar : settings.logoSidebar,
        c.greenDark,
        c.greenMid,
        c.greenLight,
        c.gold,
        c.goldLight,
        c.goldDark,
        c.bgCream,
        c.bgPageTop,
        c.bgWhite,
        c.textDark,
        c.textMuted,
        c.borderLight,
      ],
    )
    return this.get()
  }
}
