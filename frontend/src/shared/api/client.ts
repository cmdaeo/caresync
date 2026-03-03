import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Base URL without the /api suffix (for the CSRF endpoint which lives at server root)
const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '')

export const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- CSRF token management (Double Submit Cookie pattern) ---
let csrfToken: string | null = null

export async function fetchCsrfToken(): Promise<string> {
  const res = await axios.get(`${SERVER_BASE_URL}/api/csrf-token`, {
    withCredentials: true,
  })
  csrfToken = res.data.data.csrfToken
  return csrfToken!
}

// Eagerly fetch a CSRF token on app load
fetchCsrfToken().catch(() => {
  /* silent — will retry on first mutating request */
})

client.interceptors.request.use(async (config) => {
  // Attach Bearer token
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  // Attach CSRF token for mutating requests
  const method = (config.method ?? 'get').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!csrfToken) {
      await fetchCsrfToken()
    }
    config.headers = config.headers ?? {}
    config.headers['x-csrf-token'] = csrfToken
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const code = error.response?.data?.errorCode

    // If CSRF token was rejected, refresh it and retry once
    if (status === 403 && code === 'ERR_BAD_CSRF_TOKEN' && !error.config._csrfRetried) {
      error.config._csrfRetried = true
      await fetchCsrfToken()
      error.config.headers['x-csrf-token'] = csrfToken
      return client.request(error.config)
    }

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)
