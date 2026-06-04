import { env } from '../../config/env.js'
import {
  createDeveloperToken,
  isDeveloperToken,
  parseDeveloperToken,
} from '../../infrastructure/auth/developerSessionStore.js'

export class AuthService {
  constructor(userRepo, sessionRepo) {
    this.userRepo = userRepo
    this.sessionRepo = sessionRepo
  }

  isDeveloperCedula(cedula) {
    return String(cedula ?? '').trim() === env.developer.cedula
  }

  getDeveloperAccount() {
    return {
      nombre: env.developer.nombre,
      apellido: env.developer.apellido,
      cedula: env.developer.cedula,
      role: 'desarrollador',
    }
  }

  async login(cedula, password) {
    const id = String(cedula ?? '').trim()

    if (this.isDeveloperCedula(id)) {
      if (password !== env.developer.password) {
        return { ok: false, error: 'Credenciales incorrectas' }
      }
      const user = this.getDeveloperAccount()
      const token = createDeveloperToken()
      return { ok: true, user, token }
    }

    const row = await this.userRepo.findByCedula(id)
    if (!row) {
      return { ok: false, error: 'Credenciales incorrectas' }
    }

    const valid = await this.userRepo.verifyPassword(row, password)
    if (!valid) {
      return { ok: false, error: 'Credenciales incorrectas' }
    }

    const user = await this.userRepo.toPublicUser(row)
    const session = await this.sessionRepo.create(id)
    return { ok: true, user, token: session.token }
  }

  async register({ cedula, nombre, apellido, password, role }) {
    const id = String(cedula ?? '').trim()
    if (this.isDeveloperCedula(id)) {
      return { ok: false, error: 'Cédula reservada' }
    }
    if (await this.userRepo.exists(id)) {
      return { ok: false, error: 'Ya existe un usuario con esta cédula' }
    }
    await this.userRepo.create({
      cedula: id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      password,
      rol: role,
    })
    return { ok: true }
  }

  async findUserByCedula(cedula) {
    const id = String(cedula ?? '').trim()
    if (this.isDeveloperCedula(id)) return this.getDeveloperAccount()
    const row = await this.userRepo.findByCedula(id)
    return row ? this.userRepo.toPublicUser(row) : null
  }

  async updatePassword(cedula, newPassword) {
    if (this.isDeveloperCedula(cedula)) return false
    return this.userRepo.updatePassword(cedula, newPassword)
  }

  async updateProfile(cedula, updates) {
    if (this.isDeveloperCedula(cedula)) return false
    return this.userRepo.updateProfile(cedula, updates)
  }

  resolveDeveloperFromToken(token) {
    if (!isDeveloperToken(token)) return null
    const payload = parseDeveloperToken(token)
    if (!payload) return null
    return { ...this.getDeveloperAccount(), token }
  }

  async resolveSessionUser(sessionRow, token) {
    const dev = this.resolveDeveloperFromToken(token)
    if (dev) return dev
    if (!sessionRow) return null
    if (this.isDeveloperCedula(sessionRow.usuario_cedula)) {
      return { ...this.getDeveloperAccount(), token }
    }
    return {
      nombre: sessionRow.nombre,
      apellido: sessionRow.apellido,
      cedula: sessionRow.usuario_cedula,
      role: sessionRow.rol === 'administrador' ? 'administrador' : 'trabajador',
      token,
    }
  }

  async logout(token) {
    if (!token || isDeveloperToken(token)) return
    await this.sessionRepo.deleteByToken(token)
  }
}
