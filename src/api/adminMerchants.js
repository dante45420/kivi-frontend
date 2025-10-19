import { apiFetch } from './client'

export function listMerchants() {
  return apiFetch('/admin/merchants')
}

export function getMerchant(id) {
  return apiFetch(`/admin/merchants/${id}`)
}

export function createMerchant(data) {
  return apiFetch('/admin/merchants', {
    method: 'POST',
    body: data
  })
}

export function updateMerchant(id, data) {
  return apiFetch(`/admin/merchants/${id}`, {
    method: 'PATCH',
    body: data
  })
}

export function toggleMerchantStatus(id) {
  return apiFetch(`/admin/merchants/${id}/toggle`, {
    method: 'PATCH'
  })
}

export function deleteMerchant(id) {
  return apiFetch(`/admin/merchants/${id}`, {
    method: 'DELETE'
  })
}

