/**
 * Pie de página.
 */
export default function BrandFooter({ className = '' }) {
  return (
    <footer className={className ? `shell-footer ${className}` : 'shell-footer'}>
      © 2026 AgroApp. Todos los derechos reservados.
    </footer>
  )
}
