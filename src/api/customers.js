import { apiFetch } from './client'

export function listCustomers() {
  return apiFetch('/customers')
}

export function createCustomer(payload){
  return apiFetch('/customers', { method:'POST', body: payload })
}
