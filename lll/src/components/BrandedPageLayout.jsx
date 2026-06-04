import PageBackground from './PageBackground'
import BrandHeader from './BrandHeader'
import BrandFooter from './BrandFooter'
import './BrandedPageLayout.css'

/**
 * Layout base para cualquier pantalla nueva: fondo, colores y marca de la empresa.
 *
 * Ejemplo:
 * <BrandedPageLayout gradientId="goldBandMiPagina" footerClassName="mi-footer">
 *   <main>Contenido aquí</main>
 * </BrandedPageLayout>
 */
export default function BrandedPageLayout({
  children,
  gradientId = 'goldBandPage',
  showHeader = false,
  headerVariant = 'auth',
  showFooter = true,
  className = '',
  innerClassName = '',
  footerClassName = '',
}) {
  return (
    <div className={`branded-page ${className}`.trim()}>
      <PageBackground gradientId={gradientId} />
      <div className={`branded-page__inner ${innerClassName}`.trim()}>
        {showHeader && <BrandHeader variant={headerVariant} />}
        {children}
        {showFooter && <BrandFooter className={footerClassName} />}
      </div>
    </div>
  )
}
