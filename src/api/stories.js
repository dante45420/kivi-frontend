/**
 * API de Historias de Instagram
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Genera un batch de historias
 */
export async function generateStoriesBatch(settings = {}) {
  const response = await fetch(`${API_BASE}/api/social/stories/generate-batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error generando historias')
  }

  return response.json()
}

/**
 * Lista historias con filtros opcionales
 */
export async function listStories(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${API_BASE}/api/social/stories/list${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error cargando historias')
  }

  return response.json()
}

/**
 * Obtiene una historia específica
 */
export async function getStory(storyId) {
  const response = await fetch(`${API_BASE}/api/social/stories/${storyId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error cargando historia')
  }

  return response.json()
}

/**
 * Aprueba una historia
 */
export async function approveStory(storyId, scheduledDate = null) {
  const response = await fetch(`${API_BASE}/api/social/stories/${storyId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scheduled_date: scheduledDate })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error aprobando historia')
  }

  return response.json()
}

/**
 * Rechaza una historia
 */
export async function rejectStory(storyId, reason = '') {
  const response = await fetch(`${API_BASE}/api/social/stories/${storyId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error rechazando historia')
  }

  return response.json()
}

/**
 * Actualiza el contenido de una historia
 */
export async function updateStory(storyId, contentData) {
  const response = await fetch(`${API_BASE}/api/social/stories/${storyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contentData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error actualizando historia')
  }

  return response.json()
}

/**
 * Regenera historias adicionales
 */
export async function regenerateStories(targetWeek, additionalCount = 3) {
  const response = await fetch(`${API_BASE}/api/social/stories/regenerate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      target_week: targetWeek,
      additional_count: additionalCount 
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error regenerando historias')
  }

  return response.json()
}

/**
 * Obtiene estadísticas de historias
 */
export async function getStoryStats(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${API_BASE}/api/social/stories/stats${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error cargando estadísticas')
  }

  return response.json()
}

/**
 * Lista plantillas de historias
 */
export async function listTemplates(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const url = `${API_BASE}/api/social/stories/templates${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error cargando plantillas')
  }

  return response.json()
}

/**
 * Crea una nueva plantilla
 */
export async function createTemplate(templateData) {
  const response = await fetch(`${API_BASE}/api/social/stories/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error creando plantilla')
  }

  return response.json()
}

