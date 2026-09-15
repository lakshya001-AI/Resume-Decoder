import { useCallback, useEffect, useMemo, useState } from "react"
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "../lib/api"
import { AuthContext } from "./AuthContext"
import { useToast } from "./useToast"

// "loading" until the stored token has been checked against the server. Route
// guards wait on it, otherwise a refresh would bounce a logged-in user to the
// login screen for a frame before the check finishes.
const LOADING = "loading"
const AUTHENTICATED = "authenticated"
const ANONYMOUS = "anonymous"

export const AuthProvider = ({ children }) => {
  const toast = useToast()
  const [user, setUser] = useState(null)
  // With no stored token there is nothing to verify, so skip "loading" outright
  // rather than rendering the splash for a frame.
  const [status, setStatus] = useState(() => (getToken() ? LOADING : ANONYMOUS))

  const applySession = useCallback((session) => {
    setToken(session.access_token)
    setUser(session.user)
    setStatus(AUTHENTICATED)
  }, [])

  const endSession = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus(ANONYMOUS)
  }, [])

  // Any 401 from anywhere in the app means the session is gone. Re-registered
  // whenever status changes so the handler can see the status it is replacing.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Only worth announcing if the user was actually signed in — a stale
      // token rejected during the boot check is not something they did.
      if (status === AUTHENTICATED) {
        toast.error("Your session has expired. Please log in again.", {
          title: "Signed out",
        })
      }
      setUser(null)
      setStatus(ANONYMOUS)
    })
    return () => setUnauthorizedHandler(() => {})
  }, [status, toast])

  // On boot, trade the stored token for the current user. A token the server no
  // longer accepts is discarded rather than trusted.
  useEffect(() => {
    if (!getToken()) return

    let cancelled = false
    api
      .get("/api/auth/me")
      .then(({ data }) => {
        if (cancelled) return
        setUser(data)
        setStatus(AUTHENTICATED)
      })
      .catch(() => {
        if (cancelled) return
        clearToken()
        setUser(null)
        setStatus(ANONYMOUS)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post("/api/auth/login", { email, password })
      applySession(data)
      return data.user
    },
    [applySession],
  )

  const signup = useCallback(
    async ({ fullName, email, password }) => {
      const { data } = await api.post("/api/auth/signup", {
        full_name: fullName,
        email,
        password,
      })
      applySession(data)
      return data.user
    },
    [applySession],
  )

  /** Finish a social login, which hands back a bare token. */
  const adoptToken = useCallback(
    async (token) => {
      setToken(token)
      try {
        const { data } = await api.get("/api/auth/me")
        setUser(data)
        setStatus(AUTHENTICATED)
        return data
      } catch (error) {
        endSession()
        throw error
      }
    },
    [endSession],
  )

  const logout = useCallback(() => {
    // The token is stateless, so there is nothing to revoke server-side —
    // dropping it is the logout.
    endSession()
  }, [endSession])

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === LOADING,
      isAuthenticated: status === AUTHENTICATED,
      login,
      signup,
      adoptToken,
      logout,
    }),
    [user, status, login, signup, adoptToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
