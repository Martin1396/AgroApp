import { useEffect, useState } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { useCompany } from './context/CompanyContext'
import { clearSession, getSession, restoreSessionFromApi, saveSession, resolveSessionUser } from './utils/session'

function App() {
  const { loading: companyLoading } = useCompany()
  const [user, setUser] = useState(() => getSession())
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    if (companyLoading) return

    let cancelled = false
    ;(async () => {
      const restored = await restoreSessionFromApi()
      if (!cancelled && restored) setUser(restored)
      if (!cancelled) setBooting(false)
    })()

    return () => {
      cancelled = true
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
        Cargando…
      </div>
    )
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
  }

  return <AuthPage onAuthSuccess={handleAuthSuccess} />
}

export default App
