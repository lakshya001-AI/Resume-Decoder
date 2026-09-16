import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  FileUp,
  FileX2,
  Loader2,
  Lock,
  ScanLine,
  ShieldCheck,
  UserRoundX,
  X,
} from "lucide-react"
import { useToast } from "../context/useToast"
import { analyzeOfferLetter, describeFailure } from "../lib/analysis"
import AppHeader from "./appHeader"

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

// The analysis takes roughly half a minute, which is long enough that a bare
// spinner reads as "stuck". These say what is actually happening, on the rough
// timings a real run takes, so the wait feels accounted for.
const STAGES = [
  { after: 0, label: "Uploading your offer letter…" },
  { after: 2_000, label: "Reading every page…" },
  { after: 6_000, label: "Checking all 38 clauses…" },
  { after: 20_000, label: "Verifying quotes against your document…" },
  { after: 34_000, label: "Almost there — writing your report…" },
]

const ASSURANCES = [
  { icon: FileX2, label: "PDF only" },
  { icon: ShieldCheck, label: "Processed securely" },
  { icon: UserRoundX, label: "No personal details needed" },
]

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Returns a complaint about the file, or null if it is acceptable. */
const rejectionReason = (file) => {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  if (!isPdf) return "That's not a PDF. Export your offer letter as a PDF and try again."
  if (file.size > MAX_SIZE_BYTES) return `That file is over ${MAX_SIZE_MB}MB. Try a smaller PDF.`
  if (file.size === 0) return "That file is empty."
  return null
}

const UploadPage = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  // Lets an in-flight analysis be cancelled, on unmount or on request.
  const requestRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [stage, setStage] = useState(STAGES[0].label)

  // Walk the stage messages on their timings while a request is in flight.
  useEffect(() => {
    if (!analyzing) return
    const timers = STAGES.filter(({ after }) => after > 0).map(({ after, label }) =>
      setTimeout(() => setStage(label), after),
    )
    return () => timers.forEach(clearTimeout)
  }, [analyzing])

  // A navigation mid-analysis must not leave the request running.
  useEffect(() => () => requestRef.current?.abort(), [])

  const acceptFile = (candidate) => {
    if (!candidate) return
    const reason = rejectionReason(candidate)
    if (reason) {
      setFile(null)
      toast.error(reason, { title: "Can't use that file" })
      return
    }
    setFile(candidate)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    if (analyzing) return
    acceptFile(event.dataTransfer.files?.[0])
  }

  const clearFile = () => {
    setFile(null)
    // Reset the input, or picking the same file again fires no change event.
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleAnalyze = useCallback(async () => {
    if (!file || analyzing) return

    const controller = new AbortController()
    requestRef.current = controller
    setStage(STAGES[0].label)
    setAnalyzing(true)

    try {
      const report = await analyzeOfferLetter(file, { signal: controller.signal })

      // Hand the finished report to the report page in router state so it
      // renders immediately instead of fetching back what we already have.
      navigate(`/report/${report.analysisId}`, { state: { report } })
    } catch (error) {
      const failure = describeFailure(error)
      // describeFailure returns null for a cancelled request — the user already
      // knows they cancelled it, and a toast about it would be noise.
      if (failure) {
        toast.error(failure.message, { title: failure.title, duration: 9000 })
        // The detail is for the user; the error object is for whoever is
        // debugging this with the console open.
        console.error("[analysis] upload failed", error)
      }
      setAnalyzing(false)
    } finally {
      requestRef.current = null
    }
  }, [file, analyzing, navigate, toast])

  const handleCancel = () => {
    requestRef.current?.abort()
    setAnalyzing(false)
    toast.info("Analysis cancelled. Your file hasn't been stored.")
  }

  return (
    // Same conditional lock as the main page: one screen where there is room,
    // normal scrolling below that rather than clipping the button out of reach.
    <div className="flex min-h-screen flex-col bg-[#f5f4f0c1] [@media(min-height:860px)]:h-screen [@media(min-height:860px)]:overflow-hidden">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#dcefe4] px-3.5 py-1.5 text-xs font-medium text-[#0c6b4e]">
            <ScanLine className="h-3.5 w-3.5" strokeWidth={2.3} />
            Free basic check • Takes 2 minutes
          </span>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#131a16] lg:text-3xl">
            Upload your offer letter
          </h1>
          <p className="mt-2 text-sm text-[#131a16] opacity-65 lg:text-base">
            We&apos;ll check the important clauses and explain them in simple language.
          </p>
        </div>

        {/* ---------------- Dropzone ---------------- */}
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`mt-7 rounded-3xl border-2 border-dashed bg-[#ffffff] px-6 py-8 transition-colors ${
            dragging ? "border-[#0c6b4e] bg-[#f3faf6]" : "border-[#d8d4c9]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => acceptFile(event.target.files?.[0])}
            className="sr-only"
            id="offer-letter"
          />

          {analyzing ? (
            /* working state — the stage message is the whole point of it */
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcefe4]">
                <Loader2 className="h-6 w-6 animate-spin text-[#0c6b4e]" strokeWidth={2.2} />
              </span>

              <p className="mt-4 max-w-full truncate px-4 text-base font-semibold text-[#131a16]">
                {stage}
              </p>
              <p className="mt-1 text-sm text-[#131a16] opacity-55">
                This usually takes about half a minute. Keep this tab open.
              </p>

              <button
                type="button"
                onClick={handleCancel}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                Cancel
              </button>
            </div>
          ) : file ? (
            /* chosen state */
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcefe4]">
                <FileUp className="h-6 w-6 text-[#0c6b4e]" strokeWidth={2} />
              </span>

              <p className="mt-4 max-w-full truncate px-4 text-base font-semibold text-[#131a16]">
                {file.name}
              </p>
              <p className="mt-1 text-sm text-[#131a16] opacity-55">{formatSize(file.size)}</p>

              <button
                type="button"
                onClick={clearFile}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-4 py-2 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                Choose a different file
              </button>
            </div>
          ) : (
            /* empty state */
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dcefe4]">
                <FileUp className="h-6 w-6 text-[#0c6b4e]" strokeWidth={2} />
              </span>

              <p className="mt-4 text-base font-semibold text-[#131a16]">
                {dragging ? "Release to add it" : "Drop your PDF here"}
              </p>
              <p className="mt-1 text-sm text-[#131a16] opacity-50">or</p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 rounded-lg bg-[#131a16] px-6 py-2.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
              >
                Browse file
              </button>

              <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
                {ASSURANCES.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[#131a16] opacity-35" strokeWidth={2.1} />
                    <span className="text-sm text-[#131a16] opacity-55">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ---------------- Privacy note ---------------- */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#e4e1d9] bg-[#fffdf8] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#dcefe4]">
            <Lock className="h-4 w-4 text-[#0c6b4e]" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#131a16]">Privacy first</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-[#131a16] opacity-65">
              Your offer letter is only used to generate your report. It is never shared or
              used for anything else.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!file || analyzing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c6b4e] px-4 py-3.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {analyzing && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />}
          {analyzing ? "Analyzing…" : "Analyze Offer"}
        </button>

        <p className="mt-3 text-center text-xs text-[#131a16] opacity-45">
          By continuing you agree this is general information, not legal advice.
        </p>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="shrink-0 border-t border-[#e4e1d9] bg-[#ffffff]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5 lg:px-10">
          <p className="flex items-center gap-2 text-xs text-[#131a16] opacity-55">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
            Privacy first — your document is only used to generate your report. Not legal advice.
          </p>
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <li>
              <Link to="/terms" className="text-xs text-[#131a16] opacity-45 transition-opacity hover:opacity-80">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

export default UploadPage
