import { useEffect, useState } from 'react'
import AppErrorBoundary from './components/AppErrorBoundary'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { useCompany } from './context/CompanyContext'
import { clearSession, getSession, restoreSessionFromApi, saveSession, resolveSessionUser } from './utils/session'

const BOOT_TIMEOUT_MS = 12000

function App() {
  const { loading: companyLoading } = useCompany()
  const [user, setUser] = useState(() => getSession())
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (companyLoading) return

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) setBooting(false)
    }, BOOT_TIMEOUT_MS)

    ;(async () => {
      try {
        const restored = await restoreSessionFromApi()
        if (!cancelled && restored) setUser(restored)
      } finally {
        if (!cancelled) setBooting(false)
        window.clearTimeout(timeoutId)
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [companyLoading])

  const handleAuthSuccess = (sessionUser) => {
    setUser(sessionUser)
  }

  const handleUserUpdate = (sessionUser) => {
    const resolved = resolveSessionUser(sessionUser) ?? sessionUser
    setUser(resolved)
    saveSession(resolved)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
  }

  if (booting || companyLoading) {
    return (
      <div className="app-boot" role="status" aria-live="polite">
        <div style={{ textAlign: 'center' }}>
          <p>Cargando AgroApp…</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.85 }}>
            Conectando con el servidor local
          </p>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <AppErrorBoundary>
        <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
      </AppErrorBoundary>
    )
  }

  return (
    <AppErrorBoundary>
      <AuthPage onAuthSuccess={handleAuthSuccess} />
    </AppErrorBoundary>
  )
}

export default App
