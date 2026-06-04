import { DEVELOPER_ACCOUNT, isDeveloperCedula } from '../constants/auth'
import { apiRequest, setToken } from '../api/client'
import { saveSession } from './session'

export function getDeveloperAccount() {
  return { ...DEVELOPER_ACCOUNT }
}

export async function saveUser(user) {
  if (isDeveloperCedula(user.cedula)) return false
  await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      cedula: user.cedula,
      nombre: user.nombre,
      apellido: user.apellido,
      password: user.password,
      role: user.role,
    },
  })
  return true
}

export async function findUser(cedula, password) {
  const { user, token } = await apiRequest('/auth/login', {
    method: 'POST',
    body: { cedula, password },
  })
  setToken(token)
  saveSession(user, token)
  return user
}

export async function findUserByCedula(cedula) {
  const id = String(cedula ?? '').trim()
  if (isDeveloperCedula(id)) return getDeveloperAccount()
  const { user } = await apiRequest(`/users/${encodeURIComponent(id)}`)
  return user
}

export async function updateUserPassword(cedula, newPassword) {
  if (isDeveloperCedula(cedula)) return false
  const { ok } = await apiRequest(`/users/${encodeURIComponent(cedula)}/password`, {
    method: 'PATCH',
    body: { password: newPassword },
  })
  return ok
}

export async function updateUserProfile(cedula, updates) {
  if (isDeveloperCedula(cedula)) return false
  const { ok } = await apiRequest(`/users/${encodeURIComponent(cedula)}/profile`, {
    method: 'PATCH',
    body: updates,
  })
  return ok
}

export async function listUsers() {
  const { items } = await apiRequest('/users')
  return items
}

export async function deleteUser(cedula) {
  if (isDeveloperCedula(cedula)) return false
  const { ok } = await apiRequest(`/users/${encodeURIComponent(cedula)}`, {
    method: 'DELETE',
  })
  return ok
}
