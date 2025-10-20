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

export function changeChargeOrder(chargeId, orderId) {
  return apiFetch(`/charges/${chargeId}/order`, {
    method: 'PATCH',
    body: { order_id: orderId }
  })
}
