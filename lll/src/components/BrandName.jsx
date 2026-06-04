import { useCompany } from '../context/CompanyContext'

export default function BrandName({ className = '', primaryClass = '', secondaryClass = '' }) {
  const { settings } = useCompany()
  const secondary = (settings.nameSecondary || '').trim()

  return (
    <span className={className}>
      <span
        className={primaryClass}
        style={{ color: settings.namePrimaryColor || 'var(--brand-name-primary)' }}
      >
        {settings.namePrimary}
      </span>
      {secondary ? (
        <>
          {' '}
          <span
            className={secondaryClass}
            style={{ color: settings.nameSecondaryColor || 'var(--brand-name-secondary)' }}
          >
            {secondary}
          </span>
        </>
      ) : null}
    </span>
  )
}
