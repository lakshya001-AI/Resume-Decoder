import { Navigate, Outlet } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth } from "../context/useAuth"

/** Shown while the stored token is being checked, so guards never flash. */
export const AuthSplash = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#131a16]">
    <Loader2 className="h-6 w-6 animate-spin text-[#e3efe8]" />
    <span className="sr-only">Checking your session…</span>
  </div>
)

/**
 * Gate for signed-in pages. Typing /main into the address bar without a valid
 * session lands on the login screen instead.
 */
export const ProtectedRoute = () => {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <AuthSplash />
  if (!isAuthenticated) return <Navigate to="/" replace />
  return <Outlet />
}

/**
 * Gate for the login and create-account screens. A signed-in user who types /
 * or /createAccount — or hits Back after logging in — is sent to /main.
 * `replace` keeps the login screen out of history so Back cannot reach it.
 */
export const PublicOnlyRoute = () => {
  const { isLoading, isAuthenticated } = useAuth()

  if (isLoading) return <AuthSplash />
  if (isAuthenticated) return <Navigate to="/main" replace />
  return <Outlet />
}
