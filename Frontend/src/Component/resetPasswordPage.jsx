import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Link2Off, Loader2, Lock } from "lucide-react"
import { useToast } from "../context/useToast"
import { api, errorMessage } from "../lib/api"
import { MAX_PASSWORD_LENGTH, validatePassword } from "../lib/password"
import { AuthShell, StrengthMeter } from "./authShell"

const ResetPasswordPage = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const token = params.get("token") || ""

  // Checked against the server before showing the form, so an expired link says
  // so immediately instead of after the user has typed a new password.
  const [tokenState, setTokenState] = useState(token ? "checking" : "invalid")
  const [form, setForm] = useState({ password: "", confirm: "" })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    api
      .get("/api/auth/reset-password/validate", { params: { token } })
      .then(({ data }) => {
        if (!cancelled) setTokenState(data.valid ? "valid" : "invalid")
      })
      .catch(() => {
        if (!cancelled) setTokenState("invalid")
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const updateField = (name) => (event) => {
    setForm((previous) => ({ ...previous, [name]: event.target.value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const errors = {}
    const passwordError = validatePassword(form.password)
    if (passwordError) errors.password = passwordError
    if (!form.confirm) errors.confirm = "Re-enter your new password."
    else if (form.confirm !== form.password) errors.confirm = "The two passwords don't match."

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const { data } = await api.post("/api/auth/reset-password", {
        token,
        password: form.password,
      })
      toast.success(data.message, { title: "Password updated" })
      navigate("/", { replace: true })
    } catch (error) {
      // A token can expire between the check on mount and the submit.
      if (error.response?.status === 400) setTokenState("invalid")
      toast.error(errorMessage(error, "Could not reset your password. Please try again."), {
        title: "Reset failed",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (tokenState === "checking") {
    return (
      <AuthShell title="Checking your link…" align="center">
        <div className="mt-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#0c6b4e]" />
        </div>
      </AuthShell>
    )
  }

  if (tokenState === "invalid") {
    return (
      <AuthShell title="This link doesn't work" align="center">
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fdf2f0]">
            <Link2Off className="h-6 w-6 text-[#c0392b]" strokeWidth={2.2} />
          </span>
          <p className="mt-5 text-sm leading-relaxed text-[#131a16] opacity-70">
            Reset links expire after 30 minutes and can only be used once. Request a
            fresh one and we&apos;ll email it straight over.
          </p>
          <Link
            to="/forgotPassword"
            className="mt-6 w-full rounded-lg bg-[#0c6b4e] px-4 py-3 text-center text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
          >
            Request a new link
          </Link>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c6b4e] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  const inputWrapper = (hasError) =>
    `mt-2 flex items-center gap-2.5 rounded-lg border bg-[#ffffff] px-3.5 py-2.5 ${
      hasError ? "border-[#c0392b]" : "border-[#e4e1d9] focus-within:border-[#0c6b4e]"
    }`

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something you haven't used on this account before."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7">
        {/* new password */}
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#131a16] opacity-70">
            New password
          </label>
          <div className={inputWrapper(fieldErrors.password)}>
            <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              maxLength={MAX_PASSWORD_LENGTH}
              value={form.password}
              onChange={updateField("password")}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.password)}
              placeholder="Create a strong password"
              className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="shrink-0 text-[#131a16] opacity-40 transition-opacity hover:opacity-70"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.password}</p>
          ) : (
            <StrengthMeter password={form.password} />
          )}
        </div>

        {/* confirm */}
        <div className="mt-5">
          <label htmlFor="confirm" className="block text-xs font-medium text-[#131a16] opacity-70">
            Confirm new password
          </label>
          <div className={inputWrapper(fieldErrors.confirm)}>
            <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              maxLength={MAX_PASSWORD_LENGTH}
              value={form.confirm}
              onChange={updateField("confirm")}
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.confirm)}
              placeholder="Re-enter your new password"
              className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
            />
          </div>
          {fieldErrors.confirm && (
            <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.confirm}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Updating…" : "Update password"}
        </button>

        <Link
          to="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#0c6b4e] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </form>
    </AuthShell>
  )
}

export default ResetPasswordPage
