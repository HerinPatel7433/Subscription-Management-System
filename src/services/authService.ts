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
    role: 'admin' | 'internal' | 'portal'
  }
}

/**
 * Authenticate a user against the backend.
 * On success: stores the JWT in memory and returns the auth response.
 * On failure: re-throws the error so the caller can display it.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  if (data.token) {
    setMemoryToken(data.token)
  }
  return data
}

/**
 * Register a new user against the backend.
 * On success: stores the JWT in memory and returns the auth response.
 * On failure: re-throws the error so the caller can display it.
 */
export async function signupUser(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/signup', payload)
  if (data.token) {
    setMemoryToken(data.token)
  }
  return data
}

/**
 * Request a password reset email.
 * On failure: re-throws the error so the caller can display it.
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password/request', { email })
  return data
}

/**
 * Confirm a password reset with token and new password.
 * On failure: re-throws the error so the caller can display it.
 */
export async function confirmPasswordReset(payload: {
  token: string
  new_password: string
}): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password/confirm', {
    token: payload.token,
    password: payload.new_password,
  })
  return data
}

/**
 * Log out: clear the in-memory JWT and redirect to login.
 */
export function logoutUser() {
  clearMemoryToken()
  window.location.href = '/login'
}
