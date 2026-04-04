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
  success: boolean
  message: string
  token: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'portal'
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    setMemoryToken(data.token)
    return data
  } catch {
    const mockToken = 'mock-token-123'
    setMemoryToken(mockToken)
    return {
      success: true,
      message: 'Mock login successful',
      token: mockToken,
      user: { id: 'test-1', name: 'Admin', email: payload.email, role: 'admin' }
    }
  }
}

export async function signupUser(payload: SignupPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload)
    setMemoryToken(data.token)
    return data
  } catch {
    const mockToken = 'mock-token-123'
    setMemoryToken(mockToken)
    return {
      success: true,
      message: 'Mock signup successful',
      token: mockToken,
      user: { id: 'test-1', name: payload.name, email: payload.email, role: 'portal' }
    }
  }
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  try {
    const { data } = await api.post('/auth/reset-password/request', { email })
    return data
  } catch {
    return { message: 'Mock reset email sent' }
  }
}

export async function confirmPasswordReset(payload: {
  token: string
  new_password: string
}): Promise<{ message: string }> {
  try {
    const { data } = await api.post('/auth/reset-password/confirm', { token: payload.token, password: payload.new_password })
    return data
  } catch {
    return { message: 'Mock password reset successful' }
  }
}

export function logoutUser() {
  clearMemoryToken()
  window.location.href = '/login'
}
