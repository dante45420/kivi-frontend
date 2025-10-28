import { apiFetch } from './client'

export function listCustomers() {
  return apiFetch('/customers')
}

export function createCustomer(payload){
  return apiFetch('/customers', { method:'POST', body: payload })
}

export function updateCustomer(customerId, payload){
  return apiFetch(`/customers/${customerId}`, { method:'PATCH', body: payload })
}

export function deleteCustomer(customerId){
  return apiFetch(`/customers/${customerId}`, { method:'DELETE' })
}
