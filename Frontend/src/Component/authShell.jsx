import { Link } from "react-router-dom"
import { FileText } from "lucide-react"
import { STRENGTH_LABELS, scorePassword } from "../lib/password"

/**
 * Centred card used by the short auth detours (forgot / reset password), which
 * don't warrant the full two-panel treatment of login and signup.
 */
/**
 * `align` follows the body: the status screens (link sent, link expired) centre
 * their content, and a left-aligned heading above centred content reads as a
 * mistake. Form screens stay left-aligned to line up with their labels.
 */
export const AuthShell = ({ title, subtitle, align = "left", children }) => (
  <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f4f0c1] p-6 sm:p-10">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-8 flex items-center justify-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c6b4e]">
          <FileText className="h-5 w-5 text-[#ffffff]" strokeWidth={2.2} />
        </span>
        <span className="text-lg font-semibold tracking-tight text-[#131a16]">
          TrueOffer.AI
        </span>
      </Link>

      <div className="rounded-2xl border border-[#e4e1d9] bg-[#ffffff] p-8 sm:p-10">
        <div className={align === "center" ? "text-center" : undefined}>
          <h1 className="text-xl font-semibold tracking-tight text-[#131a16]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-[#131a16] opacity-60">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  </div>
)

/** The four-bar meter, shared by the signup and reset screens. */
export const StrengthMeter = ({ password }) => {
  const strength = scorePassword(password)

  return (
    <div className="mt-2.5 flex items-center gap-2">
      {[1, 2, 3, 4].map((step) => (
        <span
          key={step}
          className={`h-1 flex-1 rounded-full ${
            strength >= step ? "bg-[#0c6b4e]" : "bg-[#e4e1d9]"
          }`}
        />
      ))}
      <span className="w-12 text-[11px] font-medium text-[#0c6b4e]">
        {STRENGTH_LABELS[strength]}
      </span>
    </div>
  )
}
