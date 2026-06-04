/** Clave de administrador para recuperación de contraseña y confirmación en perfil */
export const CLAVE_ESPECIAL_ADMIN = '1036401824'

/** Aviso en login tras cambiar contraseña desde Perfil */
export const FLASH_PASSWORD_CHANGED = 'turpial_password_changed'

/** Cuenta de desarrollador (solo en código, no se registra en localStorage) */
export const DEVELOPER_ACCOUNT = {
  nombre: 'Martin',
  apellido: 'Arbelaez',
  cedula: '1036401824',
  password: '12041396',
  role: 'desarrollador',
}

export function isDeveloperCedula(cedula) {
  return String(cedula ?? '').trim() === DEVELOPER_ACCOUNT.cedula
}

export function isDeveloperRole(role) {
  return role === 'desarrollador'
}

export function isDeveloperUser(user) {
  return user && isDeveloperRole(user.role) && isDeveloperCedula(user.cedula)
}
