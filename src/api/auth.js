import { apiFetch } from './client'

export async function login(email, password) {
  return apiFetch('/login', {
    method: 'POST',
    body: { email, password }
  })
}

export async function verifyToken() {
  return apiFetch('/verify')
}

export function getToken() {
  return localStorage.getItem('kivi_token')
}

export function setToken(token) {
  localStorage.setItem('kivi_token', token)
}

export function clearToken() {
  localStorage.removeItem('kivi_token')
}

