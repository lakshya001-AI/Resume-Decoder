import { Link } from "react-router-dom"
import { FileText, ShieldCheck } from "lucide-react"
import ProfileMenu from "./profileMenu"
import { useAuth } from "../context/useAuth"

// Every page below the fold points at the same two. Defined once so a new page
// cannot quietly ship with a footer that has drifted.
const FOOTER_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
]

/**
 * Chrome for the public content pages.
 *
 * Deliberately not AppHeader: these pages are reachable while signed out — the
 * signup form links to the terms — so the account menu only appears when there
 * is an account to show, and the brand links wherever the reader can actually go.
 */
const PageShell = ({ children }) => {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f0c1]">
      <header className="shrink-0 border-b border-[#e4e1d9] bg-[#ffffff]">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 lg:px-10">
          <Link to={user ? "/main" : "/"} className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c6b4e]">
              <FileText className="h-5 w-5 text-[#ffffff]" strokeWidth={2.2} />
            </span>
            <span className="text-base font-semibold tracking-tight text-[#131a16]">
              TrueOffer.AI
            </span>
          </Link>

          {user ? (
            <ProfileMenu />
          ) : (
            <Link
              to="/"
              className="rounded-lg bg-[#131a16] px-4 py-2 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="shrink-0 border-t border-[#e4e1d9] bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <p className="flex items-center gap-2 text-xs text-[#131a16] opacity-55">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            General information, not legal advice.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {FOOTER_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-xs text-[#131a16] opacity-55 transition-opacity hover:opacity-90"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  )
}

/** A readable column for long-form text, with the page's title block. */
export const Article = ({ eyebrow, title, intro, updated, children }) => (
  <div className="mx-auto w-full max-w-3xl px-6 py-10">
    {eyebrow && (
      <span className="inline-flex items-center rounded-full bg-[#dcefe4] px-3 py-1 text-xs font-medium text-[#0c6b4e]">
        {eyebrow}
      </span>
    )}
    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#131a16]">{title}</h1>
    {intro && <p className="mt-3 text-base leading-relaxed text-[#131a16] opacity-70">{intro}</p>}
    {updated && (
      <p className="mt-2 text-xs text-[#131a16] opacity-45">Last updated {updated}</p>
    )}
    <div className="mt-8">{children}</div>
  </div>
)

/** One numbered section of a legal document. */
export const Section = ({ title, children }) => (
  <section className="mt-8 first:mt-0">
    <h2 className="text-lg font-semibold tracking-tight text-[#131a16]">{title}</h2>
    <div className="mt-2 space-y-3 text-sm leading-relaxed text-[#131a16] opacity-80">
      {children}
    </div>
  </section>
)

/** A bulleted list inside a Section. */
export const Bullets = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((item, index) => (
      <li key={index} className="flex gap-2.5">
        <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-[#0c6b4e]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)

/** A short, visually distinct aside — used for the things that matter most. */
export const Callout = ({ tone = "green", title, children }) => {
  const tones = {
    green: "border-[#cfe3d9] bg-[#f3faf6]",
    amber: "border-[#e9d3a8] bg-[#fdf6e8]",
  }
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${tones[tone]}`}>
      {title && <p className="text-sm font-semibold text-[#131a16]">{title}</p>}
      <div className="mt-1 space-y-2 text-sm leading-relaxed text-[#131a16] opacity-80">
        {children}
      </div>
    </div>
  )
}

export default PageShell
