/**
 * API de Historias de Instagram
 */
import { apiFetch } from './client'

/**
 * Genera un batch de historias
 */
export function generateStoriesBatch(settings = {}) {
  return apiFetch('/social/stories/generate-batch', { 
    method: 'POST', 
    body: settings 
  })
}

/**
 * Lista historias con filtros opcionales
 */
export function listStories(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiFetch(`/social/stories/list${queryString ? '?' + queryString : ''}`)
}

/**
 * Obtiene una historia específica
 */
export function getStory(storyId) {
  return apiFetch(`/social/stories/${storyId}`)
}

/**
 * Aprueba una historia
 */
export function approveStory(storyId, scheduledDate = null) {
  return apiFetch(`/social/stories/${storyId}/approve`, { 
    method: 'POST',
    body: { scheduled_date: scheduledDate }
  })
}

/**
 * Rechaza una historia
 */
export function rejectStory(storyId, reason = '') {
  return apiFetch(`/social/stories/${storyId}/reject`, { 
    method: 'POST',
    body: { reason }
  })
}

/**
 * Actualiza el contenido de una historia
 */
export function updateStory(storyId, contentData) {
  return apiFetch(`/social/stories/${storyId}`, { 
    method: 'PATCH',
    body: contentData
  })
}

/**
 * Regenera historias adicionales
 */
export function regenerateStories(targetWeek, additionalCount = 3) {
  return apiFetch('/social/stories/regenerate', { 
    method: 'POST',
    body: { 
      target_week: targetWeek,
      additional_count: additionalCount 
    }
  })
}

/**
 * Obtiene estadísticas de historias
 */
export function getStoryStats(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiFetch(`/social/stories/stats${queryString ? '?' + queryString : ''}`)
}

/**
 * Lista plantillas de historias
 */
export function listTemplates(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  return apiFetch(`/social/stories/templates${queryString ? '?' + queryString : ''}`)
}

/**
 * Crea una nueva plantilla
 */
export function createTemplate(templateData) {
  return apiFetch('/social/stories/templates', { 
    method: 'POST',
    body: templateData
  })
}
