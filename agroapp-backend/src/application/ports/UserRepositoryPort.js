/** Puerto de persistencia de usuarios (hexagonal) */
export class UserRepositoryPort {
  async findByCedula() {
    throw new Error('Not implemented')
  }
  async create() {
    throw new Error('Not implemented')
  }
  async updatePassword() {
    throw new Error('Not implemented')
  }
  async updateProfile() {
    throw new Error('Not implemented')
  }
}
