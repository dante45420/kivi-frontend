import { apiFetch } from './client'

// Pedidos de comerciantes (admin)
export function listAllMerchantOrders(params = {}) {
  const usp = new URLSearchParams()
  if (params.status) usp.set('status', params.status)
  if (params.merchant_id) usp.set('merchant_id', params.merchant_id)
  
  return apiFetch(`/admin/merchant-orders?${usp.toString()}`)
}

export function getMerchantOrderDetail(orderId) {
  return apiFetch(`/admin/merchant-orders/${orderId}`)
}

export function updateMerchantOrderStatus(orderId, status) {
  return apiFetch(`/admin/merchant-orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status }
  })
}

export function assignVendorToItem(orderId, itemId, vendorId) {
  return apiFetch(`/admin/merchant-orders/${orderId}/items/${itemId}/vendor`, {
    method: 'PATCH',
    body: { vendor_id: vendorId }
  })
}

// Comerciantes
export function listMerchants() {
  return apiFetch('/admin/merchants')
}

export function toggleMerchantStatus(merchantId) {
  return apiFetch(`/admin/merchants/${merchantId}/toggle`, {
    method: 'PATCH'
  })
}

