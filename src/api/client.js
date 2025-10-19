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
    const errorMsg = typeof data === 'string' ? data : (data.error || 'Error')
    const error = new Error(errorMsg)
    error.status = res.status
    throw error
  }
  
  return data
}
