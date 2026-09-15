import { useRef, useState } from "react"
import {
  FileUp,
  FileX2,
  Lock,
  ScanLine,
  ShieldCheck,
  UserRoundX,
  X,
} from "lucide-react"
import { useToast } from "../context/useToast"
import AppHeader from "./appHeader"

const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

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
  const inputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)

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
    acceptFile(event.dataTransfer.files?.[0])
  }

  const clearFile = () => {
    setFile(null)
    // Reset the input, or picking the same file again fires no change event.
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleAnalyze = () => {
    if (!file) return
    // No analysis endpoint exists yet — say so rather than pretending to work.
    toast.info("Offer letter analysis isn't switched on yet. Your file hasn't left this page.", {
      title: "Not available yet",
    })
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

          {file ? (
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
          disabled={!file}
          className="mt-4 w-full rounded-xl bg-[#0c6b4e] px-4 py-3.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Analyze Offer
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
          <p className="text-xs text-[#131a16] opacity-45">
            TrueOffer.AI • Made for Indian job seekers
          </p>
        </div>
      </footer>
    </div>
  )
}

export default UploadPage
