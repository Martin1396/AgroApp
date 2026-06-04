import {
  DEVELOPER_ACCOUNT,
  isDeveloperCedula,
} from '../constants/auth'

const USERS_KEY = 'turpial_usuarios'

export function getDeveloperAccount() {
  return { ...DEVELOPER_ACCOUNT }
}

export function getUsers() {
  try {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveUser(user) {
  if (isDeveloperCedula(user.cedula)) {
    return false
  }
  const users = getUsers()
  const id = normalizeCedula(user.cedula)
  const normalized = { ...user, cedula: id }
  const index = users.findIndex((u) => normalizeCedula(u.cedula) === id)
  if (index >= 0) {
    users[index] = normalized
  } else {
    users.push(normalized)
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return true
}

function normalizeCedula(cedula) {
  return String(cedula ?? '').trim()
}

export function findUser(cedula, password) {
  const id = normalizeCedula(cedula)
  if (isDeveloperCedula(id) && password === DEVELOPER_ACCOUNT.password) {
    return getDeveloperAccount()
  }
  const users = getUsers()
  return users.find((u) => normalizeCedula(u.cedula) === id && u.password === password) || null
}

export function findUserByCedula(cedula) {
  const id = normalizeCedula(cedula)
  if (isDeveloperCedula(id)) {
    return getDeveloperAccount()
  }
  const users = getUsers()
  return users.find((u) => normalizeCedula(u.cedula) === id) || null
}

export function updateUserPassword(cedula, newPassword) {
  if (isDeveloperCedula(cedula)) return false
  const user = findUserByCedula(cedula)
  if (!user) return false
  saveUser({ ...user, password: newPassword })
  return true
}

export function updateUserProfile(cedula, updates) {
  if (isDeveloperCedula(cedula)) return false
  const user = findUserByCedula(cedula)
  if (!user) return false
  saveUser({ ...user, ...updates })
  return true
}
