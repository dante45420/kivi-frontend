import { apiFetch } from './client'

// Instagram APIs
export function listInstagramContent(status, type) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (type) params.append('type', type)
  const query = params.toString()
  return apiFetch(`/social/instagram/content${query ? '?' + query : ''}`)
}

export function getInstagramContent(contentId) {
  return apiFetch(`/social/instagram/content/${contentId}`)
}

export function createInstagramContent(payload) {
  return apiFetch('/social/instagram/content', { method: 'POST', body: payload })
}

export function generateInstagramContent(type = 'ofertas_semana') {
  return apiFetch('/social/instagram/generate', { method: 'POST', body: { type } })
}

export function approveInstagramContent(contentId) {
  return apiFetch(`/social/instagram/content/${contentId}/approve`, { method: 'PATCH' })
}

export function rejectInstagramContent(contentId, rejectionReason) {
  return apiFetch(`/social/instagram/content/${contentId}/reject`, { 
    method: 'PATCH', 
    body: { rejection_reason: rejectionReason } 
  })
}

export function updateInstagramContent(contentId, payload) {
  return apiFetch(`/social/instagram/content/${contentId}`, { 
    method: 'PATCH', 
    body: payload 
  })
}

export function listTemplates() {
  return apiFetch('/social/instagram/templates')
}

export function createTemplate(payload) {
  return apiFetch('/social/instagram/templates', { method: 'POST', body: payload })
}

// WhatsApp APIs
export function listWhatsAppMessages(status, messageType) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  if (messageType) params.append('message_type', messageType)
  const query = params.toString()
  return apiFetch(`/social/whatsapp/messages${query ? '?' + query : ''}`)
}

export function getWhatsAppMessage(messageId) {
  return apiFetch(`/social/whatsapp/messages/${messageId}`)
}

export function previewWhatsAppMessage(customerId) {
  return apiFetch(`/social/whatsapp/preview/${customerId}`)
}

export function generateCatalogBatch() {
  return apiFetch('/social/whatsapp/generate-catalog-batch', { method: 'POST' })
}

export function approveWhatsAppMessage(messageId) {
  return apiFetch(`/social/whatsapp/message/${messageId}/approve`, { method: 'PATCH' })
}

export function rejectWhatsAppMessage(messageId) {
  return apiFetch(`/social/whatsapp/message/${messageId}/reject`, { method: 'PATCH' })
}

export function updateWhatsAppMessage(messageId, payload) {
  return apiFetch(`/social/whatsapp/message/${messageId}`, { 
    method: 'PATCH', 
    body: payload 
  })
}

export function sendTestMessage(phone) {
  return apiFetch('/social/whatsapp/send-test', { method: 'POST', body: { phone } })
}

