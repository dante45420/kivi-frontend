import { apiFetch } from './client'

// Listar todos los precios de proveedores
export function listVendorPrices(params = {}) {
  const usp = new URLSearchParams()
  if (params.vendor_id) usp.set('vendor_id', params.vendor_id)
  if (params.product_id) usp.set('product_id', params.product_id)
  if (params.available_only) usp.set('available_only', 'true')
  
  return apiFetch(`/admin/vendors/prices?${usp.toString()}`)
}

// Precios de un proveedor específico
export function getVendorPrices(vendorId) {
  return apiFetch(`/admin/vendors/${vendorId}/prices`)
}

// Crear precio manualmente
export function createVendorPrice(vendorId, data) {
  return apiFetch(`/admin/vendors/${vendorId}/prices`, {
    method: 'POST',
    body: data
  })
}

// Actualizar precio
export function updateVendorPrice(priceId, data) {
  return apiFetch(`/admin/vendors/prices/${priceId}`, {
    method: 'PUT',
    body: data
  })
}

// Eliminar precio
export function deleteVendorPrice(priceId) {
  return apiFetch(`/admin/vendors/prices/${priceId}`, {
    method: 'DELETE'
  })
}

// Toggle disponibilidad (1 click)
export function toggleVendorPriceAvailability(priceId) {
  return apiFetch(`/admin/vendors/prices/${priceId}/toggle`, {
    method: 'PATCH'
  })
}

// Batch update (Vuelta de Reconocimiento)
export function batchUpdateVendorPrices(vendorId, prices) {
  console.log('========== BATCH UPDATE API CALL ==========')
  console.log('vendorId:', vendorId, 'type:', typeof vendorId)
  console.log('prices:', prices, 'type:', typeof prices, 'isArray:', Array.isArray(prices))
  console.log('body que se enviará:', JSON.stringify({vendor_id: vendorId, prices: prices}, null, 2))
  console.log('==========================================')
  
  return apiFetch('/admin/vendors/prices/batch', {
    method: 'POST',
    body: {
      vendor_id: vendorId,
      prices: prices  // [{product_id, unit, base_price, markup_percentage}]
    }
  })
}

