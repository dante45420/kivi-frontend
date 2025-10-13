import { apiFetch } from './client'

export function listCharges(params={}){
  const usp = new URLSearchParams()
  if (params.customer_id) usp.set('customer_id', params.customer_id)
  if (params.order_id) usp.set('order_id', params.order_id)
  if (params.status) usp.set('status', params.status)
  return apiFetch(`/charges?${usp.toString()}`)
}

export function createPayment(payload){
  return apiFetch('/payments', { method:'POST', body: payload })
}

export function listPayments(params={}){
  const usp = new URLSearchParams()
  if (params.customer_id) usp.set('customer_id', params.customer_id)
  return apiFetch(`/payments?${usp.toString()}`)
}

export function listLots(productId){
  const usp = new URLSearchParams()
  if (productId) usp.set('product_id', productId)
  return apiFetch(`/inventory/lots?${usp.toString()}`)
}

export function createLot(payload){
  return apiFetch('/inventory/lots', { method:'POST', body: payload })
}

export function processLot(payload){
  return apiFetch('/inventory/process', { method:'POST', body: payload })
}

export function ordersSummary(){
  return apiFetch('/accounting/orders')
}

export function customersSummary(includeOrders){
  const usp = new URLSearchParams(); if (includeOrders) usp.set('include_orders', '1')
  return apiFetch(`/accounting/customers?${usp.toString()}`)
}


