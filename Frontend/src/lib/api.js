import axios from "axios"

// Empty in dev, so calls stay relative and go through the Vite proxy. In a
// deployed build this is the backend's own origin, baked in at build time.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({ baseURL: API_BASE_URL })

const TOKEN_KEY = "trueoffer.auth.token"

// localStorage throws in private-mode Safari and when site data is blocked, so
// every access is guarded — a browser that cannot store the token still works,
// the session just ends when the tab closes.
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore — the in-memory session still holds for this tab */
  }
}

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// AuthContext registers itself here rather than being imported, which would
// make lib and context depend on each other.
let onUnauthorized = () => {}
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A rejected token is dead whatever the caller does with the error, so drop
    // it here and let the app fall back to the login screen.
    if (error.response?.status === 401) {
      clearToken()
      onUnauthorized()
    }
    return Promise.reject(error)
  },
)

/** Pull something readable out of an axios error for display in the UI. */
export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const detail = error.response?.data?.detail

  if (typeof detail === "string") return detail

  // FastAPI 422s come back as a list of per-field validation errors.
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    return typeof first?.msg === "string" ? first.msg.replace(/^Value error, /, "") : fallback
  }

  if (error.response) return fallback
  return "Cannot reach the server. Check your connection and try again."
}

/** Send the browser off to a provider's consent screen. */
export const startSocialLogin = (provider, redirectPath = "/main") => {
  const query = new URLSearchParams({ redirect_path: redirectPath })
  window.location.href = `${API_BASE_URL}/api/auth/${provider}/authorize?${query}`
}
