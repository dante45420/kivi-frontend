import { apiFetch } from './client'

export function listProducts(includeCost = false) {
  const params = includeCost ? '?include_cost=1' : ''
  return apiFetch(`/products${params}`)
}

export function createProduct(payload) {
  return apiFetch('/products', { method: 'POST', body: payload })
}

export function updateProductQuality(productId, payload) {
  return apiFetch(`/products/${productId}/quality`, { method: 'PUT', body: payload })
}

export function suggestProducts(q) {
  const params = new URLSearchParams({ q })
  return apiFetch(`/products/suggest?${params.toString()}`)
}

export function updateProduct(productId, payload){
  return apiFetch(`/products/${productId}`, { method: 'PUT', body: payload })
}
