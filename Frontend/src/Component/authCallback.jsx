import { useEffect, useRef, useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { useToast } from "../context/useToast"
import { AuthSplash } from "./routeGuards"

const PROVIDER_LABELS = { google: "Google" }

/**
 * Landing spot for social logins. The backend sends the browser here
 * with a token on success or an error message on failure; this screen swaps the
 * token for a session and moves on, so no page ever renders with a token in the
 * visible URL.
 */
const AuthCallback = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { adoptToken } = useAuth()
  const toast = useToast()
  const [error, setError] = useState(params.get("error"))

  const token = params.get("token")
  const next = params.get("next") || "/main"
  const provider = PROVIDER_LABELS[params.get("provider")] ?? "your account"
  // StrictMode runs effects twice in dev; the token must only be redeemed once.
  const redeemed = useRef(false)

  // The backend already explained what went wrong — repeat it as a toast so it
  // is consistent with every other failure in the app.
  const announced = useRef(false)
  useEffect(() => {
    const message = params.get("error")
    if (!message || announced.current) return
    announced.current = true
    toast.error(message, { title: "Login failed" })
  }, [params, toast])

  useEffect(() => {
    if (!token || redeemed.current) return
    redeemed.current = true

    adoptToken(token)
      .then((user) => {
        toast.success(`Signed in with ${provider} as ${user.email}.`, { title: "Welcome" })
        navigate(next, { replace: true })
      })
      .catch(() => {
        const message = "We could not complete your login. Please try again."
        setError(message)
        toast.error(message, { title: "Login failed" })
      })
  }, [token, next, provider, adoptToken, navigate, toast])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#131a16] p-8">
        <div className="w-full max-w-sm rounded-xl bg-[#ffffff] p-8 text-center">
          <h1 className="text-lg font-semibold text-[#131a16]">Login failed</h1>
          <p className="mt-2 text-sm text-[#131a16] opacity-70">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 w-full rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  // Reached directly, with neither a token nor an error to act on.
  if (!token) return <Navigate to="/" replace />

  return <AuthSplash />
}

export default AuthCallback
