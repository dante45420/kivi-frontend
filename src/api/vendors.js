import { apiFetch } from './client'

export function listVendors(){
  return apiFetch('/vendors')
}

export function createVendor(payload){
  return apiFetch('/vendors', { method:'POST', body: payload })
}

export function updateVendor(id, payload){
  return apiFetch(`/vendors/${id}`, { method:'PUT', body: payload })
}

export function listVendorPrices(productId, vendorId){
  const params = new URLSearchParams()
  if (productId) params.set('product_id', productId)
  if (vendorId) params.set('vendor_id', vendorId)
  return apiFetch(`/vendor-prices?${params.toString()}`)
}

export function createVendorPrice(payload){
  return apiFetch('/vendor-prices', { method:'POST', body: payload })
}



