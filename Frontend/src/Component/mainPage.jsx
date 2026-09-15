import {
  ArrowRight,
  Banknote,
  CalendarClock,
  Check,
  Clock,
  FileCheck2,
  FileText,
  HelpCircle,
  ListChecks,
  MessagesSquare,
  Moon,
  ScanLine,
  ShieldCheck,
  Timer,
  TriangleAlert,
  Upload,
} from "lucide-react"
import ProfileMenu from "./profileMenu"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "What we check", href: "#what-we-check" },
  { label: "Privacy", href: "#privacy" },
]

const TRUST_POINTS = [
  { icon: ScanLine, label: "38-point checklist" },
  { icon: ShieldCheck, label: "Privacy first" },
  { icon: HelpCircle, label: "HR questions included" },
]

const VERDICTS = [
  { icon: Check, count: 22, label: "Clear", tile: "bg-[#dcefe4]", dot: "bg-[#0c6b4e]" },
  {
    icon: TriangleAlert,
    count: 8,
    label: "Need attention",
    tile: "bg-[#fbedd0]",
    dot: "bg-[#a8481d]",
  },
  {
    icon: HelpCircle,
    count: 8,
    label: "Not specified",
    tile: "bg-[#e8e5de]",
    dot: "bg-[#363d38]",
  },
]

// Illustrative only — the card is labelled as a sample, since there is no
// analysis backend behind these numbers yet.
const FINDINGS = [
  { icon: Banknote, label: "CTC", value: "₹9.5 LPA" },
  { icon: CalendarClock, label: "Notice Period", value: "90 days" },
  { icon: Timer, label: "Minimum Service", value: "18 months" },
  { icon: Clock, label: "Working Hours", value: "Unclear" },
  // Deliberately the last row: it is clipped by the card edge to suggest the
  // list continues behind the upsell bar.
  { icon: Moon, label: "Night Shifts", value: "Required" },
]

const STEPS = [
  { icon: Upload, title: "Upload your PDF", body: "Drop your offer letter. We read all pages securely." },
  { icon: ListChecks, title: "Get a 38-point health check", body: "Salary, bond, notice, shifts, leaves and restrictions." },
  { icon: MessagesSquare, title: "Ask HR with confidence", body: "Copy-ready questions for anything unclear." },
]

const SampleReport = () => (
  <div className="relative">
    {/* offset backing panel */}
    <div
      className="pointer-events-none absolute -top-3.5 -right-3 hidden h-full w-full rounded-[26px] bg-[#dcefe4] lg:block"
      aria-hidden="true"
    />

    <div className="relative overflow-hidden rounded-[26px] border border-[#e4e1d9] bg-[#ffffff] p-5 shadow-[0_18px_44px_-24px_rgba(19,26,22,0.3)]">
      {/* verdict panel */}
      <div className="rounded-2xl border border-[#e4e1d9] p-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="flex items-baseline gap-2 text-[15px] font-semibold text-[#131a16]">
            Offer Letter Health Check
            {/* This card renders for a signed-in user, so the figures need to be
                unmistakably not their own until real analysis exists. */}
            <span className="rounded-full bg-[#f0efea] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[#131a16] opacity-55">
              SAMPLE
            </span>
          </h2>
          <span className="shrink-0 text-xs text-[#131a16] opacity-45">38 checks performed</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {VERDICTS.map(({ icon: Icon, count, label, tile, dot }) => (
            <div key={label} className={`flex items-center gap-2.5 rounded-xl p-3 ${tile}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${dot}`}
              >
                <Icon className="h-4 w-4 text-[#ffffff]" strokeWidth={2.8} />
              </span>
              <div className="min-w-0">
                <p className="text-lg leading-none font-semibold text-[#131a16]">{count}</p>
                <p className="mt-1 text-[11px] leading-tight text-[#131a16] opacity-60">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Five findings plus the bar fill exactly six cells, so the bar lands in
          the last cell and the grid aligns it with the row beside it. Nothing
          is clipped or absolutely positioned — earlier attempts to reproduce
          the mock's cut-off row put the bar at a hand-computed offset, which
          drifted whenever a row's height changed. */}
      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        {FINDINGS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex h-11 items-center gap-2.5 rounded-xl border border-[#e4e1d9] px-3"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#131a16] opacity-40" strokeWidth={2.1} />
            <span className="truncate text-xs text-[#131a16]">
              {label} — <span className="font-medium">{value}</span>
            </span>
          </div>
        ))}

        <button
          type="button"
          className="flex h-11 items-center justify-between gap-3 rounded-xl bg-[#131a16] px-4 text-left transition-opacity hover:opacity-90"
        >
          <span className="truncate text-xs font-medium text-[#ffffff]">
            Full audit unlocks evidence
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#ffffff]" strokeWidth={2.4} />
        </button>
      </div>
    </div>

    {/* floating chip, overlapping the card's lower-left corner */}
    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#e4e1d9] bg-[#ffffff] p-3 lg:absolute lg:-bottom-7 lg:-left-9 lg:mt-0 lg:w-[19rem] lg:shadow-[0_14px_34px_-16px_rgba(19,26,22,0.32)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dcefe4]">
        <FileCheck2 className="h-4 w-4 text-[#0c6b4e]" strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#131a16]">Analyzed in 2 minutes</p>
        <p className="text-xs text-[#131a16] opacity-55">Simple language, no legal jargon</p>
      </div>
    </div>
  </div>
)

const MainPage = () => (
  // Locks to a single viewport once there is room for it. The threshold is the
  // page's own height (~820px) plus margin — below it the page scrolls normally,
  // because clipping the steps out of reach is worse than a scrollbar.
  <div className="flex min-h-screen flex-col bg-[#f5f4f0c1] [@media(min-height:860px)]:h-screen [@media(min-height:860px)]:overflow-hidden">
    {/* ---------------- Navbar ---------------- */}
    <header className="shrink-0 border-b border-[#e4e1d9] bg-[#ffffff]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c6b4e]">
            <FileText className="h-5 w-5 text-[#ffffff]" strokeWidth={2.2} />
          </span>
          <span className="text-base font-semibold tracking-tight text-[#131a16]">
            TrueOffer.AI
          </span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="text-sm text-[#131a16] opacity-70 transition-opacity hover:opacity-100"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <ProfileMenu />
      </nav>
    </header>

    {/* ---------------- Hero + how it works, one screen ---------------- */}
    <main
      id="top"
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-10 px-6 py-8 lg:px-10 lg:py-6"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.02fr] lg:items-center lg:gap-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#dcefe4] px-3.5 py-1.5 text-xs font-medium text-[#0c6b4e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0c6b4e]" />
            Built for Indian freshers &amp; engineers
          </span>

          <h1 className="mt-5 max-w-xl text-3xl leading-[1.1] font-semibold tracking-tight text-[#131a16] lg:text-4xl xl:text-[2.9rem]">
            Know what&apos;s actually in your offer before you say yes.
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#131a16] opacity-65 xl:text-base">
            Upload your offer letter and get a simple, structured breakdown of salary,
            bond, notice period, working hours, leaves, restrictions, and more.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-6">
            <button
              type="button"
              className="rounded-lg bg-[#0c6b4e] px-7 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
            >
              Check My Offer
            </button>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#131a16] underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              See sample report
            </a>
          </div>

          <p className="mt-4 text-sm text-[#131a16] opacity-50">
            Free basic check • No account required
          </p>

          <ul className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[#0c6b4e]" strokeWidth={2.2} />
                <span className="text-sm text-[#131a16] opacity-70">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <SampleReport />
      </div>

      {/* ---------------- How it works ---------------- */}
      <ul id="how-it-works" className="grid gap-5 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, body }) => (
          <li
            key={title}
            className="rounded-2xl border border-[#e4e1d9] bg-[#ffffff] p-6 transition-colors hover:border-[#cfe3d9]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dcefe4]">
              <Icon className="h-5 w-5 text-[#0c6b4e]" strokeWidth={2.2} />
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#131a16]">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#131a16] opacity-60">{body}</p>
          </li>
        ))}
      </ul>
    </main>
  </div>
)

export default MainPage
