import { useCallback, useEffect, useRef, useState } from "react"
import { AlertCircle, ChevronLeft, ChevronRight, FileSearch, Loader2, X } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import { locateQuote } from "../lib/quoteLocator"

// Vite hands us a URL for the worker bundle; without this pdf.js falls back to
// running on the main thread and locks the UI while it parses.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

// Rendering at devicePixelRatio keeps the text sharp on high-DPI screens.
const BASE_SCALE = 1.5

/** Device-space rectangle for one text item, in CSS pixels. */
const rectFor = (item, viewport) => {
  const transform = pdfjsLib.Util.transform(viewport.transform, item.transform)
  // transform[2] and [3] carry the glyph height through any rotation or skew.
  const height = Math.hypot(transform[2], transform[3]) || item.height
  const width = item.width * viewport.scale
  return {
    left: transform[4],
    top: transform[5] - height,
    width,
    height,
  }
}

/**
 * Shows the page of the offer letter a finding came from, with the quoted
 * sentence highlighted on it.
 */
const EvidenceViewer = ({ onClose, bytes, check }) => {
  const canvasRef = useRef(null)
  const documentRef = useRef(null)
  const renderTaskRef = useRef(null)

  // Mounted means open, and the caller keys this component by check id, so the
  // starting page comes straight from props — no effect needed to reset it when
  // a different finding is opened.
  const [page, setPage] = useState(check?.evidence?.page ?? 1)
  const [pageCount, setPageCount] = useState(0)
  const [highlights, setHighlights] = useState([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [loadState, setLoadState] = useState("loading")
  const [notOnPage, setNotOnPage] = useState(false)

  // Having no file at all is a property of the props, not something to discover
  // asynchronously — deriving it keeps one less state in sync.
  const status = bytes ? loadState : "nodoc"

  // Close on Escape, the way every other modal on the web does.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  // Load the document once, not once per page turn.
  useEffect(() => {
    if (!bytes) return
    let cancelled = false

    // pdf.js transfers and neuters the buffer it is given, so hand it a copy —
    // otherwise reopening the viewer finds an empty ArrayBuffer.
    const task = pdfjsLib.getDocument({ data: bytes.slice(0) })
    task.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy()
          return
        }
        documentRef.current = pdf
        setPageCount(pdf.numPages)
        setLoadState("ready")
      })
      .catch(() => {
        if (!cancelled) setLoadState("failed")
      })

    return () => {
      cancelled = true
      task.destroy?.()
      documentRef.current?.destroy()
      documentRef.current = null
    }
  }, [bytes])

  // Draw the current page and work out where the quote sits on it.
  const draw = useCallback(async () => {
    const pdf = documentRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    // Cancel any render still in flight, or two pages fight over one canvas.
    renderTaskRef.current?.cancel()

    const target = Math.min(Math.max(page, 1), pdf.numPages)
    const pdfPage = await pdf.getPage(target)
    const ratio = window.devicePixelRatio || 1
    const viewport = pdfPage.getViewport({ scale: BASE_SCALE })

    canvas.width = Math.floor(viewport.width * ratio)
    canvas.height = Math.floor(viewport.height * ratio)
    setSize({ width: viewport.width, height: viewport.height })

    const context = canvas.getContext("2d")
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const task = pdfPage.render({ canvasContext: context, viewport })
    renderTaskRef.current = task
    try {
      await task.promise
    } catch {
      return // superseded by a newer page; its render will finish instead
    }

    const quote = check?.evidence?.quote
    if (!quote) {
      setHighlights([])
      setNotOnPage(false)
      return
    }

    const { items } = await pdfPage.getTextContent()
    const hits = locateQuote(items, quote)
    setNotOnPage(hits === null)
    setHighlights(hits ? hits.map((index) => rectFor(items[index], viewport)) : [])
  }, [page, check])

  useEffect(() => {
    if (status === "ready") draw()
    return () => renderTaskRef.current?.cancel()
  }, [status, draw])

  const evidencePage = check?.evidence?.page

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131a16]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Evidence for ${check?.title ?? "this clause"}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-[#ffffff] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ------------------------------ header ----------------------------- */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e4e1d9] px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[#131a16] opacity-45">
              Evidence in your offer letter
            </p>
            <h2 className="mt-0.5 truncate text-base font-semibold text-[#131a16]">
              {check?.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1.5 text-[#131a16] opacity-50 transition-opacity hover:opacity-100"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>

        {check?.evidence?.quote && (
          <p className="shrink-0 border-b border-[#e4e1d9] bg-[#fffdf8] px-5 py-3 text-sm italic leading-relaxed text-[#131a16] opacity-80">
            &ldquo;{check.evidence.quote}&rdquo;
          </p>
        )}

        {/* ------------------------------- page ------------------------------ */}
        <div className="min-h-0 flex-1 overflow-auto bg-[#f5f4f0c1] p-5">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#0c6b4e]" strokeWidth={2.2} />
              <p className="text-sm text-[#131a16] opacity-60">Opening your offer letter&hellip;</p>
            </div>
          )}

          {status === "nodoc" && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8e5de]">
                <FileSearch className="h-6 w-6 text-[#363d38]" strokeWidth={2.1} />
              </span>
              <p className="text-sm font-medium text-[#131a16]">
                {check?.explanation ? "What this means" : "Original not on this device"}
              </p>
              {check?.explanation && (
                <p className="max-w-md text-sm leading-relaxed text-[#131a16] opacity-75">
                  {check.explanation}
                </p>
              )}
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#131a16] opacity-55">
                Your offer letter is never uploaded to our servers — it stays in the browser you
                analysed it from. To see it highlighted in the document, open this report on that
                browser{evidencePage ? `, or check page ${evidencePage} of your own copy` : ""}.
              </p>
              {check?.questions?.length > 0 && (
                <div className="mt-3 w-full max-w-md rounded-xl border border-[#e4e1d9] bg-[#ffffff] p-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#131a16] opacity-45">
                    Ask HR
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {check.questions.map((question) => (
                      <li key={question} className="flex gap-2 text-sm text-[#131a16] opacity-75">
                        <span className="text-[#0c6b4e]">&bull;</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center gap-2 py-20 text-center">
              <AlertCircle className="h-6 w-6 text-[#a8481d]" strokeWidth={2.2} />
              <p className="text-sm font-medium text-[#131a16]">Couldn&apos;t open the PDF</p>
              <p className="max-w-sm text-sm text-[#131a16] opacity-60">
                The quote and page number above still stand — open your own copy at page{" "}
                {evidencePage} to read it in context.
              </p>
            </div>
          )}

          {status === "ready" && (
            <div className="mx-auto" style={{ width: size.width }}>
              {notOnPage && (
                <p className="mb-3 rounded-xl border border-[#e4e1d9] bg-[#fbedd0] px-3 py-2 text-xs leading-relaxed text-[#a8481d]">
                  We couldn&apos;t locate this sentence on page {page} to highlight it. The quote
                  above is what we read from your document — check page {evidencePage} yourself.
                </p>
              )}
              <div className="relative overflow-hidden rounded-xl border border-[#e4e1d9] bg-[#ffffff] shadow-sm">
                <canvas
                  ref={canvasRef}
                  className="block"
                  style={{ width: size.width, height: size.height }}
                />
                {highlights.map((rect, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-[3px] bg-[#fbedd0] mix-blend-multiply ring-1 ring-[#a8481d]/35"
                    style={{
                      // A touch of padding so the box does not clip descenders.
                      left: rect.left - 1,
                      top: rect.top - 2,
                      width: rect.width + 2,
                      height: rect.height + 4,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------ footer ----------------------------- */}
        {status === "ready" && pageCount > 1 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e4e1d9] px-5 py-3">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d9] px-3 py-1.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.3} />
              Previous
            </button>

            <p className="text-xs text-[#131a16] opacity-55">
              Page {page} of {pageCount}
              {evidencePage && page !== evidencePage && (
                <button
                  type="button"
                  onClick={() => setPage(evidencePage)}
                  className="ml-2 font-medium text-[#0c6b4e] underline underline-offset-2"
                >
                  back to the quote
                </button>
              )}
            </p>

            <button
              type="button"
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              disabled={page >= pageCount}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d9] px-3 py-1.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" strokeWidth={2.3} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvidenceViewer
