import { useEffect, useState } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { clearSession, getSession, restoreSessionFromApi, saveSession, resolveSessionUser } from './utils/session'

function App() {
  const [user, setUser] = useState(() => getSession())
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    restoreSessionFromApi()
      .then((restored) => {
        if (restored) setUser(restored)
      })
      .finally(() => setBooting(false))
  }, [])

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

  if (booting) {
    return null
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
  }

  return <AuthPage onAuthSuccess={handleAuthSuccess} />
}

export default App
