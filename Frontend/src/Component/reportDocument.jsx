import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import PoppinsItalic from "../assets/fonts/Poppins-Italic.ttf"
import PoppinsMedium from "../assets/fonts/Poppins-Medium.ttf"
import PoppinsRegular from "../assets/fonts/Poppins-Regular.ttf"
import PoppinsSemiBold from "../assets/fonts/Poppins-SemiBold.ttf"

// The PDF's built-in Helvetica has no rupee sign, and this report is mostly
// salary figures — so the app's own typeface is embedded rather than risking a
// page of ₹ rendered as blanks. Poppins covers ₹, the curly quotes and the
// bullets used below.
Font.register({
  family: "Poppins",
  fonts: [
    { src: PoppinsRegular, fontWeight: 400 },
    { src: PoppinsMedium, fontWeight: 500 },
    { src: PoppinsSemiBold, fontWeight: 600 },
    { src: PoppinsItalic, fontWeight: 400, fontStyle: "italic" },
  ],
})

// Poppins has no hyphenation dictionary here, and the default hyphenator breaks
// words mid-syllable. Wrapping whole words reads better in a narrow column.
Font.registerHyphenationCallback((word) => [word])

const COLOR = {
  ink: "#131a16",
  green: "#0c6b4e",
  greenTint: "#dcefe4",
  amber: "#a8481d",
  amberTint: "#fbedd0",
  grey: "#363d38",
  greyTint: "#e8e5de",
  border: "#e4e1d9",
  cream: "#fffdf8",
  muted: "#6b716d",
}

const STATUS = {
  clear: { label: "Found", color: COLOR.green, tint: COLOR.greenTint },
  attention: { label: "Needs attention", color: COLOR.amber, tint: COLOR.amberTint },
  not_specified: { label: "Not specified", color: COLOR.grey, tint: COLOR.greyTint },
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Poppins",
    fontSize: 9,
    color: COLOR.ink,
    paddingTop: 34,
    paddingBottom: 46,
    paddingHorizontal: 40,
    // No lineHeight here on purpose. Inherited by larger text — the 19pt title,
    // the 17pt tile counts — it produced a line box shorter than the glyphs,
    // and each one overlapped the line beneath it. Body styles set their own.
  },

  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 9, fontWeight: 600, color: COLOR.green, letterSpacing: 0.3 },
  brandNote: { fontSize: 7.5, color: COLOR.muted },

  title: { fontSize: 19, fontWeight: 600, marginTop: 14, marginBottom: 4, letterSpacing: -0.3, lineHeight: 1.25 },
  fileLine: { fontSize: 8, color: COLOR.muted, lineHeight: 1.4 },

  headline: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLOR.cream,
    borderWidth: 1,
    borderColor: COLOR.border,
    borderRadius: 5,
    fontSize: 9.5,
    lineHeight: 1.5,
  },

  tiles: { flexDirection: "row", gap: 8, marginTop: 12 },
  tile: { flex: 1, borderWidth: 1, borderColor: COLOR.border, borderRadius: 5, padding: 9 },
  tileCount: { fontSize: 17, fontWeight: 600, lineHeight: 1.25 },
  tileLabel: { fontSize: 7.5, color: COLOR.muted, lineHeight: 1.4 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.3,
    marginTop: 18,
    marginBottom: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
  },
  sectionNote: { fontSize: 7.5, color: COLOR.muted, marginBottom: 6, lineHeight: 1.4 },

  check: {
    marginTop: 7,
    paddingLeft: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: COLOR.border,
  },
  checkHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  checkTitle: { fontSize: 9.5, fontWeight: 600, flex: 1, paddingRight: 8, lineHeight: 1.35 },
  pill: { fontSize: 6.5, fontWeight: 500, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 3, lineHeight: 1.3 },
  value: { fontSize: 9, color: COLOR.ink, marginTop: 1, lineHeight: 1.4 },
  explanation: { fontSize: 8, color: COLOR.muted, marginTop: 2.5, lineHeight: 1.5 },
  quote: {
    fontSize: 7.5,
    lineHeight: 1.45,
    fontStyle: "italic",
    color: COLOR.muted,
    marginTop: 3,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: COLOR.border,
  },
  unconfirmed: { fontSize: 7, color: COLOR.amber, marginTop: 2.5, lineHeight: 1.4 },

  question: { flexDirection: "row", marginTop: 5 },
  questionNumber: { fontSize: 9, fontWeight: 600, color: COLOR.green, width: 14, lineHeight: 1.5 },
  questionText: { fontSize: 9, flex: 1, lineHeight: 1.5 },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    paddingTop: 6,
    // Room for the page number, which is its own fixed element on the right.
    paddingRight: 44,
    fontSize: 6.5,
    lineHeight: 1.4,
    color: COLOR.muted,
  },
  pageNumber: {
    position: "absolute",
    bottom: 22,
    // Spans the full column and right-aligns. With `right` alone and no `left`,
    // the box computes to zero width and the number never appears.
    left: 40,
    right: 40,
    paddingTop: 6,
    fontSize: 6.5,
    color: COLOR.muted,
    textAlign: "right",
  },
})

const formatDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

const Pill = ({ status }) => {
  const style = STATUS[status]
  return (
    <Text style={[styles.pill, { backgroundColor: style.tint, color: style.color }]}>
      {style.label}
    </Text>
  )
}

const Tile = ({ count, label, color }) => (
  <View style={styles.tile}>
    <Text style={[styles.tileCount, { color }]}>{count}</Text>
    <Text style={styles.tileLabel}>{label}</Text>
  </View>
)

/** One clause. `wrap={false}` so a finding is never split across two pages. */
const Check = ({ check }) => (
  <View style={[styles.check, { borderLeftColor: STATUS[check.status].tint }]} wrap={false}>
    <View style={styles.checkHead}>
      <Text style={styles.checkTitle}>{check.title}</Text>
      <Pill status={check.status} />
    </View>

    <Text style={styles.value}>
      {check.value || (check.status === "not_specified" ? "Not stated in the letter" : "—")}
    </Text>

    {Boolean(check.explanation) && <Text style={styles.explanation}>{check.explanation}</Text>}

    {check.evidence ? (
      <Text style={styles.quote}>
        &ldquo;{check.evidence.quote}&rdquo; — page {check.evidence.page}
      </Text>
    ) : (
      check.unverified && (
        <Text style={styles.unconfirmed}>
          Unconfirmed — we could not find supporting text for this in your document.
        </Text>
      )
    )}
  </View>
)

/**
 * The downloadable report.
 *
 * Deliberately a different shape from the screen: no sidebar, no filters, one
 * linear read. The screen is for exploring; this is for keeping, printing, and
 * taking into a conversation with HR.
 */
const ReportDocument = ({ report }) => {
  const { summary, document: documentInfo, topFindings, categories, hrQuestions } = report

  return (
    <Document
      title={`Offer letter report — ${documentInfo.fileName}`}
      author="TrueOffer.AI"
      subject="38-point offer letter check"
      creator="TrueOffer.AI"
    >
      <Page size="A4" style={styles.page}>
        {/* Repeats on every page so a printed copy never loses its footing.
            The page number is a sibling, never a child of this View: a
            <Text render={...}/> nested inside a fixed View makes @react-pdf drop
            the whole View silently — no error, just no footer on any page.
            As a sibling the worst case is that the number itself is missing,
            which is what happens under Node; see the note on it below. */}
        <View style={styles.footer} fixed>
          <Text>{report.disclaimer}</Text>
        </View>
        {/* @react-pdf 4.9's `render` prop produced nothing under Node in
            testing, so the number may not appear. It is kept because it is
            free when it works and harmless when it does not — unlike nesting
            it in the footer, which takes the disclaimer down with it. */}
        <Text
          style={styles.pageNumber}
          fixed
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        />

        <View style={styles.brandRow} fixed>
          <Text style={styles.brand}>TrueOffer.AI</Text>
          <Text style={styles.brandNote}>38-point offer letter check</Text>
        </View>

        <Text style={styles.title}>Offer letter report</Text>
        <Text style={styles.fileLine}>
          {documentInfo.fileName} · {documentInfo.pages}{" "}
          {documentInfo.pages === 1 ? "page" : "pages"} · {formatDate(documentInfo.uploadedAt)} ·{" "}
          {report.analysisId}
        </Text>

        <View style={styles.tiles}>
          <Tile count={summary.clear} label="Found" color={COLOR.green} />
          <Tile count={summary.attention} label="Need attention" color={COLOR.amber} />
          <Tile count={summary.notSpecified} label="Not specified" color={COLOR.grey} />
        </View>

        {Boolean(summary.headline) && <Text style={styles.headline}>{summary.headline}</Text>}

        {topFindings.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Read these first</Text>
            <Text style={styles.sectionNote}>
              The clauses most likely to cost you something.
            </Text>
            {topFindings.map((check) => (
              <Check key={check.id} check={check} />
            ))}
          </View>
        )}

        {categories.map((category) => (
          <View key={category.id}>
            {/* The heading must not be the last thing on a page. */}
            <Text style={styles.sectionTitle} minPresenceAhead={60}>
              {category.title}
            </Text>
            <Text style={styles.sectionNote}>
              {category.checks.length} checks ·{" "}
              {category.checks.filter((c) => c.status === "clear").length} found ·{" "}
              {category.checks.filter((c) => c.status === "attention").length} need attention ·{" "}
              {category.checks.filter((c) => c.status === "not_specified").length} not specified
            </Text>
            {category.checks.map((check) => (
              <Check key={check.id} check={check} />
            ))}
          </View>
        ))}

        {hrQuestions.length > 0 && (
          <View>
            <Text style={styles.sectionTitle} minPresenceAhead={60}>
              Questions to ask HR
            </Text>
            <Text style={styles.sectionNote}>In the order worth asking.</Text>
            {hrQuestions.map((question, index) => (
              <View key={question} style={styles.question} wrap={false}>
                <Text style={styles.questionNumber}>{index + 1}.</Text>
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  )
}

export default ReportDocument
