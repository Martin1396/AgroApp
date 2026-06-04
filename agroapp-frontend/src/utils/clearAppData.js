import { apiRequest } from '../api/client'

export async function clearAllOperationalData() {
  await apiRequest('/data/operational', { method: 'DELETE' })
  return true
}
