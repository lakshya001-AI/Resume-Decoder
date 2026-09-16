import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Check,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react"
import { GoogleIcon } from "../utils/icons"
import { useAuth } from "../context/useAuth"
import { useToast } from "../context/useToast"
import { useSocialProviders } from "../hooks/useSocialProviders"
import { errorMessage, startSocialLogin } from "../lib/api"
import { EMAIL_PATTERN, MAX_PASSWORD_LENGTH, validatePassword } from "../lib/password"
import { StrengthMeter } from "./authShell"

const BENEFITS = [
  { icon: Clock, label: "Results in under 60 seconds" },
  { icon: ShieldCheck, label: "Your documents stay private & encrypted" },
  { icon: Sparkles, label: "Free for your first offer letter analysis" },
]

const AVATARS = ["PS", "RK", "AM"]

const CreateAccountPage = () => {
  const { signup } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const providers = useSocialProviders()

  const [form, setForm] = useState({ fullName: "", email: "", password: "" })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [leavingFor, setLeavingFor] = useState(null)

  const busy = submitting || leavingFor !== null

  const updateField = (name) => (event) => {
    setForm((previous) => ({ ...previous, [name]: event.target.value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  const validate = () => {
    const errors = {}
    const fullName = form.fullName.trim()
    const email = form.email.trim()

    if (!fullName) errors.fullName = "Enter your full name."
    else if (fullName.length < 2) errors.fullName = "That name looks too short."

    if (!email) errors.email = "Enter your email address."
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address."

    const passwordError = validatePassword(form.password)
    if (passwordError) errors.password = passwordError

    if (!acceptedTerms) errors.terms = "Please accept the Terms to continue."

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy || !validate()) return

    setSubmitting(true)
    try {
      const user = await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      toast.success(`Your TrueOffer.AI account is ready, ${user.full_name.split(" ")[0]}.`, {
        title: "Account created",
      })
      navigate("/main", { replace: true })
    } catch (error) {
      toast.error(errorMessage(error, "Could not create your account. Please try again."), {
        title: "Sign-up failed",
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
        <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-[#0c6b4e] opacity-40 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#0c6b4e] opacity-25 blur-[120px]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffffff]">
              <FileText className="h-5 w-5 text-[#0c6b4e]" strokeWidth={2.2} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-[#ffffff]">
              TrueOffer<span className="ml-1 text-[#e3efe8] opacity-70">AI</span>
            </span>
          </div>
        </div>

        <div className="relative mt-16 lg:mt-24">
          <h1 className="max-w-md text-3xl leading-tight font-semibold tracking-tight text-[#ffffff] sm:text-4xl">
            Don&apos;t sign blind.<br />Sign informed.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#e4e1d9] opacity-80">
            Create a free account and get an instant, AI-powered breakdown of any offer
            letter — CTC, clauses, and red flags explained in plain English.
          </p>

          <ul className="mt-9 space-y-4">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0c6b4e]">
                  <Icon className="h-4 w-4 text-[#ffffff]" strokeWidth={2.2} />
                </span>
                <span className="text-sm text-[#e4e1d9] opacity-90">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-16 flex items-center gap-4 lg:mt-24">
          <div className="flex -space-x-2.5">
            {AVATARS.map((initials) => (
              <span
                key={initials}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#131a16] bg-[#e3efe8] text-[11px] font-semibold text-[#0c6b4e]"
              >
                {initials}
              </span>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium text-[#ffffff]">Joined by professionals from</p>
            <p className="mt-0.5 text-xs text-[#e4e1d9] opacity-70">TCS, Infosys, Flipkart &amp; more</p>
          </div>
        </div>
      </div>

      {/* ---------------- Right / form panel ---------------- */}
      <div className="flex items-center justify-center bg-[#ffffff] p-8 sm:p-12 lg:p-16">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">Create your account</h2>
          <p className="mt-2 text-sm text-[#131a16] opacity-60">
            Free to start — no credit card required.
          </p>

          {/* social signup */}
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
                <GoogleIcon />
              )}
              Sign up with Google
            </button>
          </div>

          {/* divider */}
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#e4e1d9]" />
            <span className="text-xs tracking-wider text-[#131a16] opacity-40">OR</span>
            <span className="h-px flex-1 bg-[#e4e1d9]" />
          </div>

          {/* Whole-form problems (email already registered, server down) surface
              as a toast; only field-scoped errors stay inline next to their input. */}

          {/* full name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-[#131a16] opacity-70">
              Full name
            </label>
            <div className={inputWrapper(fieldErrors.fullName)}>
              <User className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={updateField("fullName")}
                disabled={busy}
                aria-invalid={Boolean(fieldErrors.fullName)}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
              />
            </div>
            {fieldErrors.fullName && (
              <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.fullName}</p>
            )}
          </div>

          {/* email */}
          <div className="mt-5">
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
            <label htmlFor="password" className="block text-xs font-medium text-[#131a16] opacity-70">
              Password
            </label>
            <div className={inputWrapper(fieldErrors.password)}>
              <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                maxLength={MAX_PASSWORD_LENGTH}
                value={form.password}
                onChange={updateField("password")}
                disabled={busy}
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

          {/* terms */}
          <label htmlFor="terms" className="mt-5 flex cursor-pointer items-start gap-2.5">
            {/* appearance-none removes the native tick along with the native
                box, so the checkmark is drawn back on top via `peer`. */}
            <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked)
                  setFieldErrors((previous) => ({ ...previous, terms: undefined }))
                }}
                disabled={busy}
                className={`peer h-4 w-4 cursor-pointer appearance-none rounded border bg-[#ffffff] transition-colors checked:border-[#0c6b4e] checked:bg-[#0c6b4e] disabled:cursor-not-allowed ${
                  fieldErrors.terms ? "border-[#c0392b]" : "border-[#e4e1d9]"
                }`}
              />
              <Check
                className="pointer-events-none absolute h-3 w-3 text-[#ffffff] opacity-0 peer-checked:opacity-100"
                strokeWidth={3.5}
                aria-hidden="true"
              />
            </span>
            <span className="text-xs leading-relaxed text-[#131a16] opacity-70">
              I agree to the{" "}
              <Link to="/terms" className="font-medium text-[#0c6b4e] hover:underline">Terms of Service</Link> and{" "}
              <Link to="/privacy-policy" className="font-medium text-[#0c6b4e] hover:underline">Privacy Policy</Link>
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="mt-1.5 text-xs text-[#c0392b]">{fieldErrors.terms}</p>
          )}

          {/* submit */}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating your account…" : "Create free account"}
          </button>

          <p className="mt-6 text-center text-sm text-[#131a16] opacity-70">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-[#0c6b4e] opacity-100 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default CreateAccountPage
