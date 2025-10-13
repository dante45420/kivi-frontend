const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  
  // Obtener token del localStorage
  const token = localStorage.getItem('kivi_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data.error || 'Error'))
  return data
}
