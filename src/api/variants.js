import { apiFetch } from './client'

export function listVariants(productId){
  const usp = new URLSearchParams(); if (productId) usp.set('product_id', productId)
  return apiFetch(`/variants?${usp.toString()}`)
}

export function createVariant(payload){
  return apiFetch('/variants', { method:'POST', body: payload })
}

export function updateVariant(id, payload){
  return apiFetch(`/variants/${id}`, { method:'PUT', body: payload })
}

export function deleteVariant(variantId){
  return apiFetch(`/variants/${variantId}`, { method:'DELETE' })
}

export function listVariantTiers(productId, variantId){
  const usp = new URLSearchParams(); if (productId) usp.set('product_id', productId); if (variantId) usp.set('variant_id', variantId)
  return apiFetch(`/variants/tiers?${usp.toString()}`)
}

export function createVariantTier(payload){
  return apiFetch('/variants/tiers', { method:'POST', body: payload })
}



