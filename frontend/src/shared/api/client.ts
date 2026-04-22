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

// --- CSRF token management (Stateless token pattern) ---
let csrfToken: string | null = null

export async function fetchCsrfToken(): Promise<string> {
  try {
    const res = await axios.get(`${SERVER_BASE_URL}/api/csrf-token`, {
      withCredentials: true,
    })
    csrfToken = res.data.data.csrfToken
    return csrfToken!
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    throw error
  }
}

// Eagerly fetch a CSRF token on app load
fetchCsrfToken().catch(() => {
  /* silent — will retry on first mutating request */
})

// --- JWT auto-refresh state ---
// Serialises concurrent 401s so only one refresh request flies at a time.
let refreshPromise: Promise<string | null> | null = null

/** URLs that should never trigger a token refresh (they are the auth flow itself). */
const AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh']

function isAuthUrl(url?: string): boolean {
  if (!url) return false
  return AUTH_URLS.some((u) => url.includes(u))
}

/**
 * Attempts to obtain a new access token via `POST /auth/refresh`.
 * The refresh token travels automatically in the HttpOnly cookie
 * (`withCredentials: true`).  A body field is included to satisfy
 * the backend's express-validator rule.
 *
 * Returns the new access token on success, or `null` on failure.
 */
async function tryRefreshToken(): Promise<string | null> {
  try {
    const res = await client.post('/auth/refresh', {
      refreshToken: 'cookie',          // satisfies body validator; controller reads cookie
    })
    const newToken: string | undefined = res.data?.data?.token
    if (newToken) {
      // Shallow-merge into Zustand — keeps `user` intact
      useAuthStore.setState({ token: newToken })
      return newToken
    }
    return null
  } catch {
    return null
  }
}

// --- Interceptors ---

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
    const originalConfig = error.config

    // If CSRF token was rejected, refresh it and retry once
    if (status === 403 && code === 'ERR_BAD_CSRF_TOKEN' && !originalConfig._csrfRetried) {
      originalConfig._csrfRetried = true
      await fetchCsrfToken()
      originalConfig.headers['x-csrf-token'] = csrfToken
      return client.request(originalConfig)
    }

    // --- JWT auto-refresh on 401 ---
    if (status === 401 && !originalConfig._authRetried && !isAuthUrl(originalConfig.url)) {
      originalConfig._authRetried = true

      // Deduplicate: if a refresh is already in flight, piggyback on it
      if (!refreshPromise) {
        refreshPromise = tryRefreshToken().finally(() => {
          refreshPromise = null
        })
      }

      const newToken = await refreshPromise

      if (newToken) {
        // Retry the original request with the fresh token
        originalConfig.headers = originalConfig.headers ?? {}
        originalConfig.headers.Authorization = `Bearer ${newToken}`
        return client.request(originalConfig)
      }

      // Refresh failed — session is truly expired
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)
