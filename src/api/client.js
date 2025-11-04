const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  
  // Obtener token del localStorage y enviarlo como X-API-Token
  const token = localStorage.getItem('kivi_token')
  if (token) {
    headers['X-API-Token'] = token
  }
  
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()
  
  // Si hay error, lanzarlo sin hacer logout automático
  // Cada componente decidirá si debe hacer logout o no
  if (!res.ok) {
    let errorMsg = 'Error'
    let errorDetails = null
    
    if (typeof data === 'string') {
      errorMsg = data
    } else if (typeof data === 'object' && data !== null) {
      errorMsg = data.error || data.message || 'Error'
      errorDetails = data.details || data.stack || null
    }
    
    const error = new Error(errorMsg)
    error.status = res.status
    error.details = errorDetails
    error.url = `${baseUrl}${path}`
    error.method = method
    
    // Log detallado para debugging
    console.error('API Error:', {
      url: `${baseUrl}${path}`,
      method,
      status: res.status,
      error: errorMsg,
      details: errorDetails,
      response: data
    })
    
    throw error
  }
  
  return data
}
