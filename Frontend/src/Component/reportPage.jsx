import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  Clock,
  Copy,
  Download,
  FileText,
  LayoutGrid,
  Loader2,
  LogOut,
  Lock,
  ShieldCheck,
  Sun,
  Upload,
} from "lucide-react"
import { useToast } from "../context/useToast"
import { describeFailure, fetchAudit } from "../lib/analysis"
import { SAMPLE_REPORT } from "../lib/sampleReport"
import AppHeader from "./appHeader"

// One place deciding how each status reads and looks, so the sidebar counts,
// the pills and the summary can never disagree about what "attention" is.
const STATUS = {
  clear: { label: "Found", pill: "bg-[#dcefe4] text-[#0c6b4e]", dot: "bg-[#0c6b4e]" },
  attention: { label: "Needs attention", pill: "bg-[#fbedd0] text-[#a8481d]", dot: "bg-[#a8481d]" },
  not_specified: { label: "Not specified", pill: "bg-[#e8e5de] text-[#363d38]", dot: "bg-[#363d38]" },
}

const CATEGORY_ICONS = {
  compensation: Banknote,
  leaving_company: LogOut,
  working_conditions: Clock,
  leaves: Sun,
  restrictions: Lock,
  other: FileText,
}

const countBy = (checks, status) => checks.filter((check) => check.status === status).length

/** The uploaded file's name, stripped of its extension and anything a filesystem would reject. */
const documentName = (fileName) =>
  (fileName || "Offer letter").replace(/\.pdf$/i, "").replace(/[\\/:*?"<>|]/g, "").trim() ||
  "Offer letter"

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

/* ------------------------------ small pieces ------------------------------ */

const StatusPill = ({ status }) => (
  <span
    className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium ${STATUS[status].pill}`}
  >
    {STATUS[status].label}
  </span>
)

const SummaryTile = ({ status, count, label }) => (
  <div className="rounded-2xl border border-[#e4e1d9] bg-[#ffffff] px-4 py-3.5">
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${STATUS[status].dot}`} aria-hidden="true" />
      <p className="text-xs text-[#131a16] opacity-60">{label}</p>
    </div>
    <p className="mt-1.5 text-2xl font-semibold leading-none text-[#131a16]">{count}</p>
  </div>
)

/** One clause, as a card in the mockup: title, value, status, evidence link. */
const CheckCard = ({ check }) => (
  <li className="rounded-xl border border-[#e4e1d9] bg-[#ffffff] px-4 py-3.5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#131a16]">{check.title}</p>
        <p className="mt-0.5 text-sm text-[#131a16] opacity-60">
          {check.value || (check.status === "not_specified" ? "Not specified" : "—")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {check.unverified && (
          <span
            className="hidden rounded-md bg-[#e8e5de] px-2 py-0.5 text-[11px] font-medium text-[#363d38] sm:inline"
            title="We couldn't find this quote in your document, so we removed it. Treat it as unconfirmed."
          >
            Unconfirmed
          </span>
        )}
        <StatusPill status={check.status} />
      </div>
    </div>

    {check.explanation && (
      <p className="mt-2.5 border-t border-[#e4e1d9] pt-2.5 text-sm leading-relaxed text-[#131a16] opacity-70">
        {check.explanation}
      </p>
    )}
  </li>
)

/* -------------------------------- the page -------------------------------- */

const ReportPage = ({ sample = false }) => {
  const { analysisId } = useParams()
  const location = useLocation()
  const toast = useToast()

  // The upload hands the finished report over in router state, so the common
  // path renders instantly. A refresh or a pasted link has none and refetches.
  // In sample mode the report is baked in, so there is nothing to fetch and
  // nothing to wait for.
  const [report, setReport] = useState(sample ? SAMPLE_REPORT : location.state?.report ?? null)
  const [loading, setLoading] = useState(sample ? false : !location.state?.report)
  const [failed, setFailed] = useState(null)
  const [section, setSection] = useState("overview")
  const [building, setBuilding] = useState(false)

  useEffect(() => {
    if (sample || report || !analysisId) return

    const controller = new AbortController()
    fetchAudit(analysisId, { signal: controller.signal })
      .then((data) => {
        setReport(data)
        setLoading(false)
      })
      .catch((error) => {
        const failure = describeFailure(error)
        if (!failure) return // aborted on unmount
        setFailed(failure)
        setLoading(false)
        toast.error(failure.message, { title: failure.title, duration: 8000 })
      })

    return () => controller.abort()
  }, [sample, analysisId, report, toast])

  const copyQuestions = useCallback(() => {
    const text = report.hrQuestions.map((question, index) => `${index + 1}. ${question}`).join("\n")
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Questions copied. Paste them into your email to HR."))
      .catch(() => toast.error("Your browser blocked the clipboard. Select and copy them manually."))
  }, [report, toast])

  const handleDownload = useCallback(async () => {
    if (building) return
    setBuilding(true)
    try {
      // The renderer and the embedded fonts are well over a megabyte between
      // them, and most readers never download. Fetch both on the first click.
      const [{ pdf }, { default: ReportDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./reportDocument"),
      ])

      const blob = await pdf(<ReportDocument report={report} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      // Name it after the offer letter, not the analysis id — this ends up in
      // someone's Downloads folder next to the original.
      link.download = `${documentName(report.document.fileName)} - TrueOffer report.pdf`
      link.click()
      // Revoke on the next tick; Safari needs the URL to still be live when
      // the click is handled.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error("[report] PDF generation failed", error)
      toast.error("We couldn't build the PDF. Check the browser console for details.", {
        title: "Download failed",
      })
    } finally {
      setBuilding(false)
    }
  }, [report, building, toast])

  // The sidebar's ordered list of destinations, counts included.
  const sections = useMemo(() => {
    if (!report) return []
    return [
      { id: "overview", title: "Overview", icon: LayoutGrid, count: null },
      ...report.categories.map((category) => ({
        id: category.id,
        title: category.title,
        icon: CATEGORY_ICONS[category.id] ?? FileText,
        count: category.checks.length,
        attention: countBy(category.checks, "attention"),
      })),
    ]
  }, [report])

  const position = sections.findIndex((entry) => entry.id === section)
  const previous = position > 0 ? sections[position - 1] : null
  const next = position >= 0 && position < sections.length - 1 ? sections[position + 1] : null

  if (loading) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[#0c6b4e]" strokeWidth={2.2} />
          <p className="text-sm text-[#131a16] opacity-60">Loading your report&hellip;</p>
        </div>
      </Shell>
    )
  }

  if (failed || !report) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fbedd0]">
            <AlertCircle className="h-6 w-6 text-[#a8481d]" strokeWidth={2.2} />
          </span>
          <h1 className="text-lg font-semibold text-[#131a16]">
            {failed?.title ?? "We couldn't load that report"}
          </h1>
          <p className="max-w-md text-sm text-[#131a16] opacity-65">
            {failed?.message ?? "The report may have expired, or the link may be wrong."}
          </p>
          <Link
            to="/upload"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#0c6b4e] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
          >
            <Upload className="h-4 w-4" strokeWidth={2.3} />
            Analyse another offer letter
          </Link>
        </div>
      </Shell>
    )
  }

  const { summary, document: documentInfo, topFindings, hrQuestions, categories } = report
  const active = categories.find((category) => category.id === section)

  return (
    <Shell>
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
        {sample && (
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[#cfe3d9] bg-[#f3faf6] p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#131a16]">This is a sample report</p>
              <p className="mt-0.5 text-sm text-[#131a16] opacity-70">
                Produced by running a fictional offer letter through the real analysis — every
                finding, quote and page number below came out of the pipeline, not a designer.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0c6b4e] px-5 py-2.5 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
            >
              <Upload className="h-4 w-4" strokeWidth={2.3} />
              Check my offer
            </Link>
          </div>
        )}

        {/* --------------------------- page header --------------------------- */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-[#131a16]">
              {documentInfo.fileName}
            </h1>
            <p className="mt-1 text-sm text-[#131a16] opacity-55">
              {documentInfo.pages} {documentInfo.pages === 1 ? "page" : "pages"} ·{" "}
              {formatDate(documentInfo.uploadedAt)} ·{" "}
              <span className="font-mono text-xs">{report.analysisId}</span>
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={building}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e4e1d9] bg-[#ffffff] px-4 py-2.5 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {building ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.3} />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2.3} />
              )}
              {building ? "Building PDF…" : "Download report"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row">
          {/* ----------------------------- sidebar ---------------------------- */}
          <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-60 lg:self-start">
            <nav className="overflow-hidden rounded-2xl border border-[#e4e1d9] bg-[#ffffff] p-1.5">
              <ul>
                {sections.map((entry) => {
                  const Icon = entry.icon
                  const selected = entry.id === section
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => setSection(entry.id)}
                        aria-current={selected ? "page" : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          selected
                            ? "bg-[#dcefe4] font-medium text-[#0c6b4e]"
                            : "text-[#131a16] opacity-75 hover:bg-[#f5f4f0c1] hover:opacity-100"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={2.1} />
                        <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                        {entry.count !== null && (
                          <span
                            className={`shrink-0 text-xs ${
                              entry.attention > 0
                                ? "font-semibold text-[#a8481d]"
                                : "opacity-45"
                            }`}
                          >
                            {entry.count}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>

            {hrQuestions.length > 0 && (
              <div
                className={`mt-3 rounded-2xl bg-[#131a16] p-4 ${
                  section === "questions" ? "ring-2 ring-[#0c6b4e] ring-offset-2" : ""
                }`}
              >
                <p className="text-sm font-semibold text-[#ffffff]">Questions to ask HR</p>
                <p className="mt-1 text-xs leading-relaxed text-[#ffffff] opacity-60">
                  {hrQuestions.length} questions ready from this report.
                </p>
                <button
                  type="button"
                  onClick={() => setSection("questions")}
                  aria-current={section === "questions" ? "page" : undefined}
                  className="mt-3 w-full rounded-lg bg-[#ffffff] px-3 py-2 text-xs font-semibold text-[#131a16] transition-opacity hover:opacity-90"
                >
                  {section === "questions" ? "Showing all" : "View all"}
                </button>
              </div>
            )}
          </aside>

          {/* ------------------------------ content --------------------------- */}
          <div className="min-w-0 flex-1">
            {section === "overview" && (
              <section>
                <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">Overview</h2>
                <p className="mt-1 text-sm text-[#131a16] opacity-55">
                  {summary.totalChecks} checks across {categories.length} areas of your offer.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <SummaryTile status="clear" count={summary.clear} label="Found" />
                  <SummaryTile status="attention" count={summary.attention} label="Need attention" />
                  <SummaryTile
                    status="not_specified"
                    count={summary.notSpecified}
                    label="Not specified"
                  />
                </div>

                {summary.headline && (
                  <p className="mt-4 rounded-2xl border border-[#e4e1d9] bg-[#ffffff] p-4 text-sm leading-relaxed text-[#131a16] opacity-80">
                    {summary.headline}
                  </p>
                )}

                {topFindings.length > 0 && (
                  <>
                    <h3 className="mt-6 text-base font-semibold text-[#131a16]">Read these first</h3>
                    <p className="mt-0.5 text-sm text-[#131a16] opacity-55">
                      The clauses most likely to cost you something.
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {topFindings.map((check) => (
                        <CheckCard key={check.id} check={check} />
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}

            {section === "questions" && (
              <section>
                <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">
                  Questions to ask HR
                </h2>
                <p className="mt-1 text-sm text-[#131a16] opacity-55">
                  Copy-ready, in the order worth asking.
                </p>

                <button
                  type="button"
                  onClick={copyQuestions}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#e4e1d9] bg-[#ffffff] px-3 py-2 text-xs font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1]"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.3} />
                  Copy all
                </button>

                <ol className="mt-4 space-y-2.5">
                  {hrQuestions.map((question, index) => (
                    <li
                      key={question}
                      className="flex gap-3 rounded-xl border border-[#e4e1d9] bg-[#ffffff] px-4 py-3 text-sm text-[#131a16] opacity-85"
                    >
                      <span className="shrink-0 font-semibold text-[#0c6b4e]">{index + 1}.</span>
                      {question}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {active && (
              <section>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-[#131a16]">
                      {active.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#131a16] opacity-55">
                      {active.checks.length} checks · {countBy(active.checks, "clear")} found ·{" "}
                      {countBy(active.checks, "attention")} need attention ·{" "}
                      {countBy(active.checks, "not_specified")} not specified
                    </p>
                  </div>
                  {countBy(active.checks, "attention") > 0 && (
                    <span className="rounded-md bg-[#fbedd0] px-2.5 py-1 text-[11px] font-medium text-[#a8481d]">
                      {countBy(active.checks, "attention")} need attention
                    </span>
                  )}
                </div>

                <ul className="mt-4 space-y-2.5">
                  {active.checks.map((check) => (
                    <CheckCard key={check.id} check={check} />
                  ))}
                </ul>
              </section>
            )}

            {/* -------------------- previous / next category ------------------- */}
            {position >= 0 && (previous || next) && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => previous && setSection(previous.id)}
                  disabled={!previous}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#e4e1d9] bg-[#ffffff] px-4 py-3 text-sm font-medium text-[#131a16] transition-colors hover:bg-[#f5f4f0c1] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.3} />
                  {previous?.title ?? "Start"}
                </button>
                <button
                  type="button"
                  onClick={() => next && setSection(next.id)}
                  disabled={!next}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#131a16] px-4 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {next?.title ?? "End"}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.3} />
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-xs leading-relaxed text-[#131a16] opacity-45">
              {report.disclaimer}
            </p>
          </div>
        </div>
      </div>

    </Shell>
  )
}

/** Page chrome shared by the loading, error and loaded states. */
const Shell = ({ children }) => (
  <div className="flex min-h-screen flex-col bg-[#f5f4f0c1] print:bg-[#ffffff]">
    <div className="print:hidden">
      <AppHeader />
    </div>
    {children}
    <footer className="shrink-0 border-t border-[#e4e1d9] bg-[#ffffff] print:hidden">
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

export default ReportPage
