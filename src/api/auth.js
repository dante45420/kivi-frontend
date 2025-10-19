import { apiFetch } from './client'

// Login unificado: intenta admin primero, luego comerciante
export async function login(email, password) {
  // Intentar login como admin (token tradicional)
  try {
    const response = await apiFetch('/login', {
      method: 'POST',
      body: { email, password }
    })
    return {
      token: response.token,
      userType: 'admin',
      user: null
    }
  } catch (adminError) {
    // Si falla admin, intentar como comerciante
    try {
      const merchantResponse = await apiFetch('/merchant/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      return {
        token: merchantResponse.token,
        userType: 'merchant',
        user: merchantResponse.user
      }
    } catch (merchantError) {
      // Si ambos fallan, lanzar el error del comerciante (más específico)
      throw new Error('Credenciales inválidas')
    }
  }
}

export async function verifyToken() {
  return apiFetch('/verify')
}

export function getToken() {
  return localStorage.getItem('kivi_token')
}

export function getUserType() {
  return localStorage.getItem('kivi_user_type') || 'admin'
}

export function setToken(token) {
  localStorage.setItem('kivi_token', token)
}

export function setUserType(userType) {
  localStorage.setItem('kivi_user_type', userType)
}

export function setUserData(userData) {
  localStorage.setItem('kivi_user_data', JSON.stringify(userData || {}))
}

export function getUserData() {
  const data = localStorage.getItem('kivi_user_data')
  return data ? JSON.parse(data) : null
}

export function clearToken() {
  localStorage.removeItem('kivi_token')
  localStorage.removeItem('kivi_user_type')
  localStorage.removeItem('kivi_user_data')
}
