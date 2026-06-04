import { clearAllInventario } from './inventory'
import { clearAllProductions } from './productions'
import { clearAllVentas } from './sales'

/** Elimina producción, ventas e inventario (activos e historial). No borra usuarios ni sesión. */
export function clearAllOperationalData() {
  clearAllProductions()
  clearAllVentas()
  clearAllInventario()
  return true
}
