import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-boot" role="alert">
          <div style={{ maxWidth: 420, padding: '1rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '0.75rem', color: 'var(--text-dark)', fontWeight: 600 }}>
              No se pudo cargar la aplicación
            </p>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Prueba recargar la página (Ctrl+Shift+R). Si sigue igual, cierra sesión en el navegador
              borrando datos del sitio para localhost.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: 10,
                border: 'none',
                background: 'var(--green-dark)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
