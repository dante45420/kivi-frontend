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

export function ordersSummary(includeDetails){
  const usp = new URLSearchParams(); if (includeDetails) usp.set('include_details', '1')
  return apiFetch(`/accounting/orders?${usp.toString()}`)
}

export function customersSummary(includeOrders){
  const usp = new URLSearchParams(); if (includeOrders) usp.set('include_orders', '1')
  return apiFetch(`/accounting/customers?${usp.toString()}`)
}

export function updateChargePrice(chargeId, unitPrice) {
  return apiFetch(`/charges/${chargeId}/price`, {
    method: 'PATCH',
    body: { unit_price: unitPrice }
  })
}

export function updateChargeQuantity(chargeId, chargedQty) {
  return apiFetch(`/charges/${chargeId}/quantity`, {
    method: 'PATCH',
    body: { charged_qty: chargedQty }
  })
}

export function assignLotToCustomer(lotId, data) {
  return apiFetch(`/inventory/lots/${lotId}/assign`, {
    method: 'POST',
    body: data
  })
}

export function returnChargeToExcess(chargeId, data) {
  return apiFetch(`/charges/${chargeId}/return`, {
    method: 'POST',
    body: data
  })
}

export function changeChargeOrder(chargeId, orderId) {
  return apiFetch(`/charges/${chargeId}/order`, {
    method: 'PATCH',
    body: { order_id: orderId }
  })
}

export function markLotAsWaste(lotId) {
  return apiFetch(`/inventory/lots/${lotId}/waste`, {
    method: 'POST'
  })
}

export function registerPayment(data) {
  return apiFetch('/payments', {
    method: 'POST',
    body: data
  })
}

export function listPayments(customerId) {
  const params = customerId ? `?customer_id=${customerId}` : ''
  return apiFetch(`/payments${params}`)
}
