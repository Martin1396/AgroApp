import { useState, useEffect } from 'react'
import { Building2, ImagePlus, KeyRound, Palette, RotateCcw, Trash2 } from 'lucide-react'
import { CLAVE_ESPECIAL_ADMIN } from '../constants/auth'
import { useCompany } from '../context/CompanyContext'
import {
  COLOR_FIELDS,
  DEFAULT_COMPANY,
  getFullCompanyName,
  resolveAssetUrl,
} from '../utils/company'
import { clearAllOperationalData } from '../utils/clearAppData'
import ConfirmDialog from './ConfirmDialog'
import SpecialKeyModal from './SpecialKeyModal'
import './CompanySettingsPanel.css'

const MAX_LOGO_BYTES = 900_000

function FieldError({ error }) {
  if (!error) return null
  return <p className="company-form__error">{error}</p>
}

function ScaleControl({ id, label, value, onChange, min = 50, max = 200 }) {
  return (
    <div className="company-form__group">
      <label htmlFor={id}>{label}</label>
      <div className="company-scale-control">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="company-scale-control__range"
        />
        <span className="company-scale-control__value">{value}%</span>
      </div>
    </div>
  )
}

function NameColorPicker({ id, label, value, onChange }) {
  return (
    <div className="company-form__group">
      <label htmlFor={id}>{label}</label>
      <div className="company-color-inputs">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="company-input company-input--plain company-input--hex"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === '') {
              onChange(v || value)
            }
          }}
          onBlur={(e) => {
            if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
              onChange(value)
            }
          }}
        />
      </div>
    </div>
  )
}

export default function CompanySettingsPanel({ onSaved, onDataCleared, autoUnlock = false }) {
  const { settings, updateSettings, setPreviewDraft, clearPreview } = useCompany()
  const [unlocked, setUnlocked] = useState(autoUnlock)
  const [unlockCode, setUnlockCode] = useState('')
  const [unlockError, setUnlockError] = useState('')
  const [errors, setErrors] = useState({})
  const [logoError, setLogoError] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showClearKeyModal, setShowClearKeyModal] = useState(false)

  const [draft, setDraft] = useState(() => ({
    namePrimary: settings.namePrimary,
    nameSecondary: settings.nameSecondary,
    namePrimaryColor: settings.namePrimaryColor,
    nameSecondaryColor: settings.nameSecondaryColor,
    nameFontSizeScale: settings.nameFontSizeScale ?? DEFAULT_COMPANY.nameFontSizeScale,
    logoSizeScale: settings.logoSizeScale ?? DEFAULT_COMPANY.logoSizeScale,
    tagline: settings.tagline,
    logoMain: settings.logoMain,
    logoSidebar: settings.logoSidebar,
    colors: { ...settings.colors },
  }))

  useEffect(() => {
    if (!unlocked) {
      clearPreview()
      return
    }
    setPreviewDraft({
      namePrimary: draft.namePrimary,
      nameSecondary: draft.nameSecondary,
      namePrimaryColor: draft.namePrimaryColor,
      nameSecondaryColor: draft.nameSecondaryColor,
      nameFontSizeScale: draft.nameFontSizeScale,
      logoSizeScale: draft.logoSizeScale,
      tagline: draft.tagline,
      logoMain: draft.logoMain,
      logoSidebar: draft.logoSidebar,
      colors: { ...draft.colors },
    })
    return () => clearPreview()
  }, [draft, unlocked, setPreviewDraft, clearPreview])

  const handleUnlock = (e) => {
    e.preventDefault()
    if (unlockCode.trim() !== CLAVE_ESPECIAL_ADMIN) {
      setUnlockError('Clave especial incorrecta')
      return
    }
    setUnlockError('')
    setUnlocked(true)
  }

  const handleColorChange = (key, value) => {
    setDraft((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setLogoError('Selecciona un archivo de imagen (PNG, JPG, etc.)')
      return
    }

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('La imagen es muy grande. Usa una menor a 900 KB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setDraft((prev) => ({
        ...prev,
        logoMain: dataUrl,
        logoSidebar: dataUrl,
      }))
      setLogoError('')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleResetLogo = () => {
    setDraft((prev) => ({
      ...prev,
      logoMain: DEFAULT_COMPANY.logoMain,
      logoSidebar: DEFAULT_COMPANY.logoSidebar,
      logoSizeScale: DEFAULT_COMPANY.logoSizeScale,
    }))
    setLogoError('')
  }

  const handleResetColors = () => {
    setDraft((prev) => ({
      ...prev,
      colors: { ...DEFAULT_COMPANY.colors },
      namePrimaryColor: DEFAULT_COMPANY.namePrimaryColor,
      nameSecondaryColor: DEFAULT_COMPANY.nameSecondaryColor,
    }))
  }

  const handleClearAllConfirm = () => {
    setShowClearConfirm(false)
    setShowClearKeyModal(true)
  }

  const handleClearAllFinal = () => {
    clearAllOperationalData()
    setShowClearKeyModal(false)
    onDataCleared?.()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}

    if (!draft.namePrimary.trim() && !draft.nameSecondary.trim()) {
      next.namePrimary = 'Ingresa al menos un nombre (una o dos palabras)'
    }
    if (!draft.tagline.trim()) {
      next.tagline = 'Ingresa el eslogan'
    }

    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    const primary = draft.namePrimary.trim()
    const secondary = draft.nameSecondary.trim()

    const payload = {
      namePrimary: (primary || secondary).toUpperCase(),
      nameSecondary: primary && secondary ? secondary.toUpperCase() : '',
      namePrimaryColor: draft.namePrimaryColor,
      nameSecondaryColor: draft.nameSecondaryColor,
      nameFontSizeScale: draft.nameFontSizeScale,
      logoSizeScale: draft.logoSizeScale,
      tagline: draft.tagline.trim().toUpperCase(),
      logoMain: draft.logoMain,
      logoSidebar: draft.logoSidebar,
      colors: { ...draft.colors },
    }

    updateSettings(payload)
    setErrors({})
    onSaved?.()
  }

  if (!unlocked) {
    return (
      <section className="company-panel">
        <div className="company-panel__header">
          <div className="company-panel__icon-wrap">
            <KeyRound size={28} />
          </div>
          <h2 className="company-panel__title">Acceso restringido</h2>
          <p className="company-panel__subtitle">
            Ingresa la clave especial para configurar la empresa
          </p>
        </div>

        <form className="company-unlock" onSubmit={handleUnlock}>
          <div className="company-form__group">
            <label htmlFor="company-unlock-code">Clave especial</label>
            <div
              className={`company-input ${unlockError ? 'company-input--error' : ''}`}
            >
              <KeyRound className="company-input__icon" size={18} />
              <input
                id="company-unlock-code"
                type="password"
                placeholder="Clave especial"
                autoComplete="off"
                value={unlockCode}
                onChange={(e) => {
                  setUnlockCode(e.target.value)
                  setUnlockError('')
                }}
              />
            </div>
            <FieldError error={unlockError} />
          </div>
          <button type="submit" className="company-btn company-btn--green">
            Aceptar
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="company-panel company-panel--settings">
      <div className="company-panel__header">
        <div className="company-panel__icon-wrap company-panel__icon-wrap--green">
          <Building2 size={28} />
        </div>
        <h2 className="company-panel__title">Configuración de la empresa</h2>
        <p className="company-panel__subtitle">
          Personaliza el nombre, logo y colores de toda la aplicación
        </p>
      </div>

      <form className="company-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="company-form__section company-form__section--danger">
          <p className="company-form__hint company-form__hint--danger">
            Borra producción, ventas, inventario e historial. La aplicación quedará vacía como al
            inicio. No elimina usuarios ni la configuración de la empresa.
          </p>
          <button
            type="button"
            className="company-btn company-btn--danger"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={18} />
            Limpiar todo
          </button>
        </fieldset>

        <fieldset className="company-form__section">
          <legend>
            <Building2 size={18} />
            Nombre de la empresa
          </legend>
          <p className="company-form__hint">
            Misma tipografía (Montserrat). Puedes usar una sola palabra o dos. Los cambios se ven
            en vivo en la página.
          </p>
          <div className="company-form__row">
            <div className="company-form__group">
              <label htmlFor="name-primary">Nombre principal</label>
              <input
                id="name-primary"
                type="text"
                className={`company-input company-input--plain ${errors.namePrimary ? 'company-input--error' : ''}`}
                placeholder="Ej: TURPIAL"
                value={draft.namePrimary}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, namePrimary: e.target.value }))
                }
              />
              <FieldError error={errors.namePrimary} />
            </div>
            <div className="company-form__group">
              <label htmlFor="name-secondary">Segunda palabra (opcional)</label>
              <input
                id="name-secondary"
                type="text"
                className="company-input company-input--plain"
                placeholder="Opcional — ej: DORADO"
                value={draft.nameSecondary}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, nameSecondary: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="company-form__row">
            <NameColorPicker
              id="name-primary-color"
              label="Color de la primera palabra"
              value={draft.namePrimaryColor}
              onChange={(value) => setDraft((p) => ({ ...p, namePrimaryColor: value }))}
            />
            <NameColorPicker
              id="name-secondary-color"
              label="Color de la segunda palabra"
              value={draft.nameSecondaryColor}
              onChange={(value) => setDraft((p) => ({ ...p, nameSecondaryColor: value }))}
            />
          </div>
          <ScaleControl
            id="name-font-scale"
            label="Tamaño del nombre"
            value={draft.nameFontSizeScale}
            onChange={(value) => setDraft((p) => ({ ...p, nameFontSizeScale: value }))}
          />
          <button
            type="button"
            className="company-btn company-btn--ghost company-btn--small"
            onClick={() =>
              setDraft((p) => ({ ...p, nameFontSizeScale: DEFAULT_COMPANY.nameFontSizeScale }))
            }
          >
            <RotateCcw size={16} />
            Restaurar tamaño del nombre
          </button>
          <div className="company-form__group">
            <label htmlFor="tagline">Eslogan</label>
            <input
              id="tagline"
              type="text"
              className={`company-input company-input--plain ${errors.tagline ? 'company-input--error' : ''}`}
              placeholder="Ej: GESTIÓN AGRÍCOLA INTELIGENTE"
              value={draft.tagline}
              onChange={(e) => setDraft((p) => ({ ...p, tagline: e.target.value }))}
            />
            <FieldError error={errors.tagline} />
          </div>
          <div
            className="company-preview-name"
            style={{ fontSize: `${(draft.nameFontSizeScale / 100) * 1.35}rem` }}
          >
            <span
              className="company-preview-name__primary"
              style={{ color: draft.namePrimaryColor }}
            >
              {draft.namePrimary.trim() || draft.nameSecondary.trim() || '—'}
            </span>
            {draft.nameSecondary.trim() && draft.namePrimary.trim() ? (
              <>
                {' '}
                <span
                  className="company-preview-name__secondary"
                  style={{ color: draft.nameSecondaryColor }}
                >
                  {draft.nameSecondary}
                </span>
              </>
            ) : null}
          </div>
        </fieldset>

        <fieldset className="company-form__section">
          <legend>
            <ImagePlus size={18} />
            Logo
          </legend>
          <div className="company-logo-upload">
            <div
              className="company-logo-preview"
              style={{
                width: `${(draft.logoSizeScale / 100) * 100}px`,
                height: `${(draft.logoSizeScale / 100) * 100}px`,
              }}
            >
              <img src={resolveAssetUrl(draft.logoMain)} alt="Vista previa del logo" />
            </div>
            <div className="company-logo-actions">
              <label className="company-btn company-btn--outline">
                <ImagePlus size={18} />
                Subir imagen
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  hidden
                />
              </label>
              <button
                type="button"
                className="company-btn company-btn--ghost"
                onClick={handleResetLogo}
              >
                <RotateCcw size={16} />
                Restaurar logo original
              </button>
            </div>
          </div>
          <ScaleControl
            id="logo-size-scale"
            label="Tamaño del logo"
            value={draft.logoSizeScale}
            onChange={(value) => setDraft((p) => ({ ...p, logoSizeScale: value }))}
          />
          <FieldError error={logoError} />
        </fieldset>

        <fieldset className="company-form__section">
          <legend>
            <Palette size={18} />
            Paleta de colores
          </legend>
          <p className="company-form__hint company-form__hint--live">
            Mira el menú lateral, los fondos y los botones mientras mueves cada color. Al restaurar,
            el nombre principal vuelve a negro y la segunda palabra a dorado.
          </p>
          <button
            type="button"
            className="company-btn company-btn--ghost company-btn--small"
            onClick={handleResetColors}
          >
            <RotateCcw size={16} />
            Restaurar colores originales
          </button>
          <div className="company-colors">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="company-color-row">
                <label htmlFor={`color-${key}`}>{label}</label>
                <div className="company-color-inputs">
                  <input
                    id={`color-${key}`}
                    type="color"
                    value={draft.colors[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                  />
                  <input
                    type="text"
                    className="company-input company-input--plain company-input--hex"
                    value={draft.colors[key]}
                    onChange={(e) => {
                      const v = e.target.value
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === '') {
                        handleColorChange(key, v || draft.colors[key])
                      }
                    }}
                    onBlur={(e) => {
                      const v = e.target.value
                      if (!/^#[0-9A-Fa-f]{6}$/.test(v)) {
                        handleColorChange(key, draft.colors[key])
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="company-btn company-btn--green company-btn--save">
          Guardar cambios
        </button>
        <p className="company-form__footer-hint">
          Vista previa del nombre completo:{' '}
          <strong>{getFullCompanyName(draft)}</strong>
        </p>
      </form>

      {showClearConfirm && (
        <ConfirmDialog
          title="Limpiar todo"
          message="¿Está seguro que desea limpiar todo? Se eliminarán producción, ventas, inventario e historial. Esta acción no se puede deshacer."
          confirmLabel="Sí, continuar"
          cancelLabel="No"
          onConfirm={handleClearAllConfirm}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {showClearKeyModal && (
        <SpecialKeyModal
          title="Limpiar todo"
          message="Ingresa la clave especial para vaciar producción, ventas e inventario."
          confirmLabel="Limpiar todo"
          onConfirm={handleClearAllFinal}
          onCancel={() => setShowClearKeyModal(false)}
        />
      )}
    </section>
  )
}
