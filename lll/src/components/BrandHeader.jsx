import BrandName from './BrandName'
import BrandLogo from './BrandLogo'
import BrandTagline from './BrandTagline'
import './BrandHeader.css'

/**
 * Cabecera con logo y nombre de la empresa.
 * Usar en login, registro y cualquier página nueva.
 */
export default function BrandHeader({ variant = 'auth', className = '' }) {
  return (
    <header className={`brand-header brand-header--${variant} ${className}`.trim()}>
      <div className="brand-header__logo-wrap">
        <BrandLogo variant="main" className="brand-header__logo" />
      </div>
      <div className="brand-header__text">
        <h1 className="brand-header__title">
          <BrandName primaryClass="brand-header__primary" secondaryClass="brand-header__secondary" />
        </h1>
        <BrandTagline className="brand-header__tagline" />
      </div>
    </header>
  )
}
