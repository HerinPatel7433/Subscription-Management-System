import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // sends httpOnly cookie automatically
})

// ── Request interceptor: attach JWT from memory store ────────────────
api.interceptors.request.use(
  (config) => {
    // Token is stored in module-level memory (not localStorage) for XSS safety.
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
      // Clear in-memory token and redirect to login
      clearMemoryToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ── In-memory token store (module-level, survives re-renders but not refresh) ──
let _token: string | null = null

export function setMemoryToken(token: string) {
  _token = token
}

export function getMemoryToken(): string | null {
  return _token
}

export function clearMemoryToken() {
  _token = null
}

export default api
