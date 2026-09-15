import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react"
import { useToast } from "../context/useToast"
import { api, errorMessage } from "../lib/api"
import { EMAIL_PATTERN } from "../lib/password"
import { AuthShell } from "./authShell"

const ForgotPasswordPage = () => {
  const toast = useToast()

  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const trimmed = email.trim()
    if (!trimmed) return setFieldError("Enter your email address.")
    if (!EMAIL_PATTERN.test(trimmed)) return setFieldError("Enter a valid email address.")

    setSubmitting(true)
    setFieldError("")
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email: trimmed })
      setSent(true)
      toast.success(data.message, { title: "Check your inbox" })
    } catch (error) {
      toast.error(errorMessage(error, "Could not send the reset link. Please try again."), {
        title: "Something went wrong",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" align="center">
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3efe8]">
            <MailCheck className="h-6 w-6 text-[#0c6b4e]" strokeWidth={2.2} />
          </span>
          <p className="mt-5 text-sm leading-relaxed text-[#131a16] opacity-70">
            If an account exists for{" "}
            <span className="font-semibold opacity-100">{email.trim()}</span>, we&apos;ve
            sent it a link to reset the password. The link expires in 30 minutes.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[#131a16] opacity-50">
            Nothing arrived? Check your spam folder, or try again in a few minutes.
          </p>

          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 w-full rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
          >
            Use a different email
          </button>
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

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to set a new one."
    >
      <form onSubmit={handleSubmit} noValidate className="mt-7">
        <label htmlFor="email" className="block text-xs font-medium text-[#131a16] opacity-70">
          Email address
        </label>
        <div
          className={`mt-2 flex items-center gap-2.5 rounded-lg border bg-[#ffffff] px-3.5 py-2.5 ${
            fieldError ? "border-[#c0392b]" : "border-[#e4e1d9] focus-within:border-[#0c6b4e]"
          }`}
        >
          <Mail className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setFieldError("")
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldError)}
            placeholder="you@company.com"
            className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
          />
        </div>
        {fieldError && <p className="mt-1.5 text-xs text-[#c0392b]">{fieldError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Sending…" : "Send reset link"}
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

export default ForgotPasswordPage
