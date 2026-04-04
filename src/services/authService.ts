import api, { setMemoryToken, clearMemoryToken } from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface SignupPayload {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'portal'
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  setMemoryToken(data.access_token)
  return data
}

export async function signupUser(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  setMemoryToken(data.access_token)
  return data
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/forgot-password', { email })
  return data
}

export async function confirmPasswordReset(payload: {
  token: string
  new_password: string
}): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}

export function logoutUser() {
  clearMemoryToken()
  window.location.href = '/login'
}
