import { apiFetch } from './client'

// Productos B2B
export function getMerchantProducts() {
  return apiFetch('/merchant/products')
}

export function getMerchantVendors() {
  return apiFetch('/merchant/vendors')
}

// Pedidos
export function createMerchantOrder(orderData) {
  return apiFetch('/merchant/orders', {
    method: 'POST',
    body: orderData
  })
}

export function listMerchantOrders() {
  return apiFetch('/merchant/orders')
}

export function getMerchantOrder(orderId) {
  return apiFetch(`/merchant/orders/${orderId}`)
}

