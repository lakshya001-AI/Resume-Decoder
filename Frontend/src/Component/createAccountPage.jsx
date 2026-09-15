import { Link } from "react-router-dom"
import { Clock, ShieldCheck, Sparkles, User, Mail, Lock, Eye, FileText } from "lucide-react"
import { GoogleIcon, LinkedinIcon } from "../utils/icons"

const BENEFITS = [
  { icon: Clock, label: "Results in under 60 seconds" },
  { icon: ShieldCheck, label: "Your documents stay private & encrypted" },
  { icon: Sparkles, label: "Free for your first offer letter analysis" },
]

const AVATARS = ["PS", "RK", "AM"]

const CreateAccountPage = () => {
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
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">Create your account</h2>
          <p className="mt-2 text-sm text-[#131a16] opacity-60">
            Free to start — no credit card required.
          </p>

          {/* social signup */}
          <div className="mt-7 space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
            >
              <GoogleIcon />
              Sign up with Google
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
            >
              <LinkedinIcon />
              Sign up with LinkedIn
            </button>
          </div>

          {/* divider */}
          <div className="my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-[#e4e1d9]" />
            <span className="text-xs tracking-wider text-[#131a16] opacity-40">OR</span>
            <span className="h-px flex-1 bg-[#e4e1d9]" />
          </div>

          {/* full name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-[#131a16] opacity-70">
              Full name
            </label>
            <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-3.5 py-2.5 focus-within:border-[#0c6b4e]">
              <User className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Priya Sharma"
                className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
              />
            </div>
          </div>

          {/* email */}
          <div className="mt-5">
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
            <label htmlFor="password" className="block text-xs font-medium text-[#131a16] opacity-70">
              Password
            </label>
            <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-3.5 py-2.5 focus-within:border-[#0c6b4e]">
              <Lock className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" />
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                className="w-full bg-transparent text-sm text-[#131a16] outline-none placeholder:text-[#131a16] placeholder:opacity-35"
              />
              <Eye className="h-4 w-4 shrink-0 cursor-pointer text-[#131a16] opacity-40" />
            </div>

            {/* strength meter */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="h-1 flex-1 rounded-full bg-[#0c6b4e]" />
              <span className="h-1 flex-1 rounded-full bg-[#0c6b4e]" />
              <span className="h-1 flex-1 rounded-full bg-[#0c6b4e]" />
              <span className="h-1 flex-1 rounded-full bg-[#e4e1d9]" />
              <span className="text-[11px] font-medium text-[#0c6b4e]">Strong</span>
            </div>
          </div>

          {/* terms */}
          <label htmlFor="terms" className="mt-5 flex cursor-pointer items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-[#e4e1d9] bg-[#ffffff] checked:border-[#0c6b4e] checked:bg-[#0c6b4e]"
            />
            <span className="text-xs leading-relaxed text-[#131a16] opacity-70">
              I agree to the{" "}
              <a href="#" className="font-medium text-[#0c6b4e] hover:underline">Terms of Service</a> and{" "}
              <a href="#" className="font-medium text-[#0c6b4e] hover:underline">Privacy Policy</a>
            </span>
          </label>

          {/* submit */}
          <button
            type="button"
            className="mt-6 w-full rounded-lg bg-[#0c6b4e] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
          >
            Create free account
          </button>

          <p className="mt-6 text-center text-sm text-[#131a16] opacity-70">
            Already have an account?{" "}
            <Link to="/" className="font-semibold text-[#0c6b4e] opacity-100 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateAccountPage
