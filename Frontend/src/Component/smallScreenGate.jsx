import { useEffect, useState } from "react"
import { ArrowLeftToLine, ArrowRightToLine, Maximize2 } from "lucide-react"
import { useViewportSize } from "../hooks/useViewportSize"

// The two-panel auth layout needs real width to make sense, so below this the
// app shows the gate instead. Change these two numbers to move the cutoff.
export const MIN_WIDTH = 768
export const MIN_HEIGHT = 480

const QUIPS = [
  "This offer letter does not fit through that window.",
  "I've read 60-page contracts. This width is the hard part.",
  "Somewhere in here is a CTC breakdown. It needs elbow room.",
  "Squeezing me won't reveal the hidden clauses any faster.",
  "Even the fine print has standards.",
]

/** The mascot: a document that visibly objects to being squashed. */
const SquashedDoc = ({ squeeze }) => (
  <div className="relative flex h-44 items-center justify-center">
    {/* arrows leaning in from both sides */}
    <ArrowRightToLine
      className="animate-gate-push-left absolute left-0 h-7 w-7 text-[#0c6b4e]"
      strokeWidth={2.4}
      aria-hidden="true"
    />
    <ArrowLeftToLine
      className="animate-gate-push-right absolute right-0 h-7 w-7 text-[#0c6b4e]"
      strokeWidth={2.4}
      aria-hidden="true"
    />

    <div className="animate-gate-float">
      {/* scaleX is driven by how far below the threshold the window is, so the
          character squashes in real time as the window is dragged narrower. */}
      <div
        className="animate-gate-wobble origin-center transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${squeeze})` }}
      >
        <svg width="132" height="150" viewBox="0 0 132 150" aria-hidden="true">
          {/* page body with a folded corner */}
          <path
            d="M18 12a8 8 0 0 1 8-8h58l30 30v104a8 8 0 0 1-8 8H26a8 8 0 0 1-8-8z"
            fill="#ffffff"
          />
          <path d="M84 4l30 30H92a8 8 0 0 1-8-8z" fill="#e3efe8" />

          {/* eyes — the group blinks on a timer */}
          <g className="animate-gate-blink origin-center">
            <circle cx="52" cy="72" r="7" fill="#131a16" />
            <circle cx="88" cy="72" r="7" fill="#131a16" />
            <circle cx="54.5" cy="69.5" r="2.4" fill="#ffffff" />
            <circle cx="90.5" cy="69.5" r="2.4" fill="#ffffff" />
          </g>

          {/* strained eyebrows */}
          <path d="M44 58l14-5" stroke="#131a16" strokeWidth="4" strokeLinecap="round" />
          <path d="M96 58l-14-5" stroke="#131a16" strokeWidth="4" strokeLinecap="round" />

          {/* wavy "not enjoying this" mouth */}
          <path
            d="M50 101q7-8 14 0t14 0"
            stroke="#131a16"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* a bead of sweat */}
          <ellipse
            className="animate-gate-drip"
            cx="104"
            cy="62"
            rx="4"
            ry="5.5"
            fill="#4aa3e0"
          />
        </svg>
      </div>
    </div>
  </div>
)

/**
 * Blocks the app on viewports too small for it, with something worth looking at.
 *
 * Rendered above the router, so it covers every route including the signed-in
 * pages — resizing mid-session swaps to the gate and back without losing state.
 */
const SmallScreenGate = ({ children }) => {
  const { width, height } = useViewportSize()
  const [quip, setQuip] = useState(0)

  const tooNarrow = width < MIN_WIDTH
  const tooShort = height < MIN_HEIGHT
  const blocked = tooNarrow || tooShort

  useEffect(() => {
    if (!blocked) return
    const timer = setInterval(() => setQuip((i) => (i + 1) % QUIPS.length), 3800)
    return () => clearInterval(timer)
  }, [blocked])

  if (!blocked) return children

  // 1 at the threshold, floors at 0.45 so the mascot stays recognisable.
  const squeeze = Math.max(0.45, Math.min(1, width / MIN_WIDTH))
  const progress = Math.round(Math.min(100, (width / MIN_WIDTH) * 100))
  const shortfall = Math.max(0, MIN_WIDTH - width)

  return (
    <div
      role="alert"
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#131a16] px-6 py-10 text-center"
    >
      {/* ambient glows, same treatment as the login panel */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#0c6b4e] opacity-40 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#0c6b4e] opacity-25 blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <SquashedDoc squeeze={squeeze} />

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#ffffff]">
          {tooShort && !tooNarrow ? "A bit more headroom?" : "Mind stretching that?"}
        </h1>

        {/* key on the index so each quip re-runs the fade */}
        <p
          key={quip}
          className="animate-gate-fade-up mx-auto mt-3 min-h-[40px] max-w-xs text-sm leading-relaxed text-[#e4e1d9] opacity-80"
        >
          {QUIPS[quip]}
        </p>

        {/* live measurements — the bar fills as the window widens */}
        <div className="mt-7 rounded-xl border border-[#ffffff1a] bg-[#ffffff0d] p-4">
          <div className="flex items-baseline justify-between text-xs text-[#e4e1d9]">
            <span className="opacity-60">Your window</span>
            <span className="font-semibold tabular-nums text-[#ffffff]">
              {width} × {height}
            </span>
          </div>

          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#ffffff1f]">
            <div
              className="h-full rounded-full bg-[#0c6b4e] transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-baseline justify-between text-xs text-[#e4e1d9]">
            <span className="opacity-60">Needs at least</span>
            <span className="font-semibold tabular-nums text-[#ffffff]">
              {MIN_WIDTH} × {MIN_HEIGHT}
            </span>
          </div>
        </div>

        <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#e3efe8] opacity-70">
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          {tooNarrow
            ? `${shortfall}px to go — the page unlocks itself`
            : "Give the window a little more height"}
        </p>
      </div>
    </div>
  )
}

export default SmallScreenGate
