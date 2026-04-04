import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // sends httpOnly cookie automatically
})

// ── Request interceptor: attach JWT from persistent store ────────────────
api.interceptors.request.use(
  (config) => {
    const token = getMemoryToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 globally ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and auth, redirect to login
      clearMemoryToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export function setMemoryToken(token: string) {
  useAuthStore.getState().setToken(token)
}

export function getMemoryToken(): string | null {
  return useAuthStore.getState().token
}

export function clearMemoryToken() {
  useAuthStore.getState().clearAuth()
}

export default api
