import { useCompany } from '../context/CompanyContext'

export default function BrandTagline({ className = '' }) {
  const { settings } = useCompany()
  return <p className={className}>{settings.tagline}</p>
}
