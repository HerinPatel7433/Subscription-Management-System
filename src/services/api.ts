import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const convertKeysToSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => convertKeysToSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      acc[toSnakeCase(key)] = convertKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
};

// ── Response interceptor: handle 401 globally and convert keys ────────────────────────
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = convertKeysToSnakeCase(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
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
