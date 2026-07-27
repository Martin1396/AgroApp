import { apiRequest } from '../api/client'

export async function getComercializadoras() {
  const { items } = await apiRequest('/sales/comercializadoras')
  return items
}

export async function addComercializadora(nombre) {
  const { item } = await apiRequest('/sales/comercializadoras', {
    method: 'POST',
    body: { nombre },
  })
  return item
}

export async function deleteComercializadora(id) {
  const { ok } = await apiRequest(`/sales/comercializadoras/${id}`, { method: 'DELETE' })
  return ok
}

export async function getVariedadesCatalogo() {
  const { items } = await apiRequest('/sales/variedades')
  return items
}

export async function addVariedadCatalogo(nombre) {
  const { item } = await apiRequest('/sales/variedades', {
    method: 'POST',
    body: { nombre },
  })
  return item
}

export async function deleteVariedadCatalogo(id) {
  const { ok } = await apiRequest(`/sales/variedades/${id}`, { method: 'DELETE' })
  return ok
}
