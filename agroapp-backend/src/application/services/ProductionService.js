export class ProductionService {
  constructor(repo) {
    this.repo = repo
  }

  camasRangesOverlap(desdeA, hastaA, desdeB, hastaB) {
    const a = Math.min(Number(desdeA), Number(hastaA))
    const b = Math.max(Number(desdeA), Number(hastaA))
    const c = Math.min(Number(desdeB), Number(hastaB))
    const d = Math.max(Number(desdeB), Number(hastaB))
    if ([a, b, c, d].some(Number.isNaN)) return false
    return a <= d && c <= b
  }

  async findActiveCamasConflict(desdeCama, hastaCama) {
    return this.repo.findActiveCamasConflict(Number(desdeCama), Number(hastaCama))
  }

  getTotalCortes(cortes) {
    return (cortes ?? []).reduce((sum, c) => sum + Number(c.cantidad || 0), 0)
  }
}
