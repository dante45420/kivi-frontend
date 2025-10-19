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

// Verificar token según el tipo de usuario
export async function verifyCurrentToken() {
  const userType = getUserType()
  const token = getToken()
  
  if (!token) {
    return { valid: false, error: 'No token' }
  }
  
  try {
    if (userType === 'merchant') {
      // Verificar token de merchant
      const data = await apiFetch('/merchant/auth/me')
      return { valid: true, user: data }
    } else {
      // Verificar token de admin
      const data = await apiFetch('/verify')
      return { valid: true, user: data.user }
    }
  } catch (error) {
    // Si es 401, el token es inválido
    if (error.status === 401) {
      return { valid: false, error: 'Token inválido' }
    }
    // Otros errores no invalidan el token (puede ser temporal)
    return { valid: true, error: error.message }
  }
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
