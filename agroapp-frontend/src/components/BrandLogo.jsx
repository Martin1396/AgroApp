import { useCompany } from '../context/CompanyContext'
import { resolveAssetUrl } from '../utils/company'

export default function BrandLogo({
  variant = 'main',
  className = '',
  alt,
  withHeroWrap = false,
}) {
  const { settings } = useCompany()
  const rawSrc = variant === 'sidebar' ? settings.logoSidebar : settings.logoMain
  const src = resolveAssetUrl(rawSrc)
  const altText = alt ?? `${settings.namePrimary} ${settings.nameSecondary}`

  const img = <img src={src} alt={altText} className={className} />

  if (withHeroWrap) {
    return <div className="dashboard-hero__logo-wrap">{img}</div>
  }

  return img
}
