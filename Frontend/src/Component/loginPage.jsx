import { Link } from "react-router-dom"
import { Check, Mail, Lock, Eye, FileText } from "lucide-react"
import { GoogleIcon, LinkedinIcon } from "../utils/icons"

const FEATURES = [
  "CTC breakdown — fixed vs variable, in-hand estimate",
  "Bond, notice period & clawback clause detection",
  "Instant red-flag & green-flag risk score",
]

const LoginPage = () => {
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
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">Welcome back</h2>
            <p className="mt-2 text-sm text-[#131a16] opacity-60">
              Log in to review your offer letter analysis.
            </p>

            {/* social logins */}
            <div className="mt-7 space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
              >
                <GoogleIcon/>
                Continue with Google
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
              >
                <LinkedinIcon/>
                Continue with LinkedIn
              </button>
            </div>

            {/* divider */}
            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#e4e1d9]" />
              <span className="text-xs tracking-wider text-[#131a16] opacity-40">OR</span>
              <span className="h-px flex-1 bg-[#e4e1d9]" />
            </div>

            {/* email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#131a16] opacity-70">
                Email address
              </label>
              <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-3.5 py-2.5 focus-within:border-[#0c6b4e]">
                <Mail className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
                />
              </div>
            </div>

            {/* password */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-[#131a16] opacity-70">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-[#0c6b4e] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-3.5 py-2.5 focus-within:border-[#0c6b4e]">
                <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
                />
                <Eye className="h-4 w-4 shrink-0 cursor-pointer text-[#131a16] opacity-40" />
              </div>
            </div>
            
            {/* submit */}
            <button
              type="button"
              className="mt-6 w-full rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
            >
              Log in to my account
            </button>

            <p className="mt-6 text-center text-sm text-[#131a16] opacity-70">
              Don&apos;t have an account?{" "}
              <Link to="/createAccount" className="font-semibold text-[#0c6b4e] opacity-100 hover:underline">
                Create one for free
              </Link>
            </p>

            <p className="mt-8 text-center text-[11px] leading-relaxed text-[#131a16] opacity-45">
              By continuing, you agree to TrueOffer.AI&apos;s{" "}
              <a href="#" className="underline">Terms of Service</a> and{" "}
              <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
    </div>
  )
}

export default LoginPage
