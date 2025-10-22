import { apiFetch } from './client'

export function listOrders() {
  return apiFetch('/orders')
}

export function getOrderDetail(id) {
  return apiFetch(`/orders/${id}`)
}

export function addItemsToOrder(orderId, items) {
  return apiFetch(`/orders/${orderId}/items`, {
    method: 'POST',
    body: { items }
  })
}

export function deleteOrderItem(orderId, itemId) {
  return apiFetch(`/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE'
  })
}

export function getDraft() {
  return apiFetch('/orders/draft')
}

export function getDraftDetail() {
  return apiFetch('/orders/draft/detail')
}

export function addItemsToDraft(items) {
  return apiFetch('/orders/draft/items', { method: 'POST', body: { items } })
}

export function confirmDraft() {
  return apiFetch('/orders/draft/confirm', { method: 'POST' })
}
