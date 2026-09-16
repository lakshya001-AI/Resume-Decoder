import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Check, Eye, EyeOff, FileText, Loader2, Lock, Mail } from "lucide-react"
import { GoogleIcon } from "../utils/icons"
import { useAuth } from "../context/useAuth"
import { useToast } from "../context/useToast"
import { useSocialProviders } from "../hooks/useSocialProviders"
import { errorMessage, startSocialLogin } from "../lib/api"

const FEATURES = [
  "CTC breakdown — fixed vs variable, in-hand estimate",
  "Bond, notice period & clawback clause detection",
  "Instant red-flag & green-flag risk score",
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LoginPage = () => {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const providers = useSocialProviders()

  const [form, setForm] = useState({ email: "", password: "" })
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Set once a social button is clicked — the browser is leaving the page, so
  // the button stays in its loading state until it does.
  const [leavingFor, setLeavingFor] = useState(null)

  const busy = submitting || leavingFor !== null

  const updateField = (name) => (event) => {
    setForm((previous) => ({ ...previous, [name]: event.target.value }))
    // Clear the complaint as soon as the user starts fixing it.
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  const validate = () => {
    const errors = {}
    if (!form.email.trim()) errors.email = "Enter your email address."
    else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address."
    if (!form.password) errors.password = "Enter your password."
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy || !validate()) return

    setSubmitting(true)
    try {
      const user = await login(form.email.trim(), form.password)
      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}.`, {
        title: "Logged in",
      })
      // Return to whatever page sent them here, or the main page.
      navigate(location.state?.from || "/main", { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, "Could not log you in. Please try again."), {
        title: "Login failed",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSocial = (provider) => () => {
    if (busy) return
    setLeavingFor(provider)
    startSocialLogin(provider)
  }

  const inputWrapper = (hasError) =>
    `mt-2 flex items-center gap-2.5 rounded-lg border bg-[#ffffff] px-3.5 py-2.5 ${
      hasError ? "border-[#c0392b]" : "border-[#e4e1d9] focus-within:border-[#0c6b4e]"
    }`

  return (
    <div className="grid min-h-screen w-full bg-[#f5f4f0c1] lg:grid-cols-2">

        {/* ---------------- Left / brand panel ---------------- */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#131a16] p-8 sm:p-12 lg:p-16">
          {/* ambient glows */}
          <div className="pointer-events-none absolute -top-24 -left-16 h-80 w-80 rounded-full bg-[#0c6b4e] opacity-40 blur-[110px]" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-[#0c6b4e] opacity-25 blur-[120px]" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffffff]">
                <FileText className="h-5 w-5 text-[#0c6b4e]" strokeWidth={2.2} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-[#ffffff]">
                TrueOffer.AI
              </span>
            </div>
          </div>

          <div className="relative mt-16 lg:mt-24">
            <h1 className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-[#ffffff] sm:text-4xl">
              Know exactly what<br />you&apos;re signing.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#e4e1d9] opacity-80">
              Upload your offer letter and get an instant, plain-English breakdown of pay
              structure, clauses, and hidden red flags — before you accept.
            </p>

            <ul className="mt-9 space-y-4">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#0c6b4e]">
                    <Check className="h-3.5 w-3.5 text-[#ffffff]" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-[#e4e1d9] opacity-90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-16 flex items-center gap-10 lg:mt-24">
            <div>
              <p className="text-2xl font-semibold text-[#ffffff]">42,000+</p>
              <p className="mt-1 text-xs text-[#e4e1d9] opacity-70">Offer letters analyzed</p>
            </div>
            <div className="h-10 w-px bg-[#e4e1d9] opacity-20" />
            <div>
              <p className="text-2xl font-semibold text-[#ffffff]">4.8/5</p>
              <p className="mt-1 text-xs text-[#e4e1d9] opacity-70">Candidate rating</p>
            </div>
          </div>
        </div>

        {/* ---------------- Right / form panel ---------------- */}
        <div className="flex items-center justify-center bg-[#ffffff] p-8 sm:p-12 lg:p-16">
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
            <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">Welcome back</h2>
            <p className="mt-2 text-sm text-[#131a16] opacity-60">
              Log in to review your offer letter analysis.
            </p>

            {/* social login */}
            <div className="mt-7">
              <button
                type="button"
                onClick={handleSocial("google")}
                disabled={busy || providers.google === false}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {leavingFor === "google" ? (
                  <Loader2 className="h-[18px] w-[18px] animate-spin" />
                ) : (
                  <GoogleIcon/>
                )}
                Continue with Google
              </button>
            </div>

            {/* divider */}
            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e4e1d9]" />
              <span className="text-xs tracking-wider text-[#131a16] opacity-40">OR</span>
              <span className="h-px flex-1 bg-[#e4e1d9]" />
            </div>

            {/* Whole-form problems (wrong credentials, server down) surface as a
                toast; only field-scoped errors stay inline next to their input. */}

            {/* email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#131a16] opacity-70">
                Email address
              </label>
              <div className={inputWrapper(fieldErrors.email)}>
                <Mail className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField("email")}
                  disabled={busy}
                  aria-invalid={Boolean(fieldErrors.email)}
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.email}</p>
              )}
            </div>

            {/* password */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-[#131a16] opacity-70">
                  Password
                </label>
                <Link
                  to="/forgotPassword"
                  className="text-xs font-medium text-[#0c6b4e] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className={inputWrapper(fieldErrors.password)}>
                <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={updateField("password")}
                  disabled={busy}
                  aria-invalid={Boolean(fieldErrors.password)}
                  placeholder="Enter your password"
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
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.password}</p>
              )}
            </div>

            {/* submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Logging in…" : "Log in to my account"}
            </button>

            <p className="mt-6 text-center text-sm text-[#131a16] opacity-70">
              Don&apos;t have an account?{" "}
              <Link to="/createAccount" className="font-semibold text-[#0c6b4e] opacity-100 hover:underline">
                Create one for free
              </Link>
            </p>

            <p className="mt-8 text-center text-[11px] leading-relaxed text-[#131a16] opacity-45">
              By continuing, you agree to TrueOffer.AI&apos;s{" "}
              <Link to="/terms" className="underline">Terms of Service</Link> and{" "}
              <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
    </div>
  )
}

export default LoginPage
