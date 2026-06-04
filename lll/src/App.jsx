import { useState } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { getSession, saveSession, resolveSessionUser } from './utils/session'

function App() {
  const [user, setUser] = useState(() => getSession())

  const handleAuthSuccess = (sessionUser) => {
    setUser(sessionUser)
  }

  const handleUserUpdate = (sessionUser) => {
    const resolved = resolveSessionUser(sessionUser) ?? sessionUser
    setUser(resolved)
    saveSession(resolved)
  }

  const handleLogout = () => {
    setUser(null)
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
  }

  return <AuthPage onAuthSuccess={handleAuthSuccess} />
}

export default App
