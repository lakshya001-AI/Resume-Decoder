/**
 * Finds a quoted sentence among a PDF page's text items.
 *
 * The quote came from our own extraction of this very PDF, but it travelled
 * through a language model on the way back, so its casing and whitespace can
 * differ from the page. Matching normalised forms is what makes the lookup
 * reliable; the index map is what turns a hit back into something the viewer
 * can draw a box around.
 *
 * Kept free of React and pdf.js on purpose — the matching is the part most
 * likely to be subtly wrong, so it needs to be testable on its own.
 */

// How much of a quote has to line up before we accept a partial match, and how
// long that partial has to be to count as distinctive rather than coincidental.
const PREFIX_WORDS = 12
const MIN_PREFIX_CHARS = 25

// The floor for matching anything at all. The extractor is told to quote the
// span that proves the point — in practice a sentence — so a real quote clears
// this easily. Without it, a stray "the" matches the first coincidental "the"
// on the page and we highlight words that have nothing to do with the finding.
const MIN_MATCH_WORDS = 2
const MIN_MATCH_CHARS = 8

/**
 * Flatten text for matching, keeping a map back to the original offsets.
 *
 * `offsets[i]` is the index in `text` that produced `normalised[i]`, so a match
 * found in the normalised string can be mapped back to the real character range.
 */
export const normaliseWithMap = (text) => {
  let normalised = ""
  const offsets = []
  let previousWasSpace = true // leading whitespace is dropped, not collapsed

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (/\s/.test(character)) {
      if (previousWasSpace) continue
      normalised += " "
      offsets.push(index)
      previousWasSpace = true
      continue
    }
    normalised += character.toLowerCase()
    offsets.push(index)
    previousWasSpace = false
  }

  // A trailing space would never match anything; drop it and its offset together.
  while (normalised.endsWith(" ")) {
    normalised = normalised.slice(0, -1)
    offsets.pop()
  }
  return { normalised, offsets }
}

export const normaliseQuote = (quote) => normaliseWithMap(quote).normalised

/**
 * Which of the page's text items the quote covers.
 *
 * Returns an array of item indices, or null when the quote is not on this page —
 * which the viewer reports honestly rather than showing an unmarked page and
 * letting the reader assume we found it.
 */
export const locateQuote = (items, quote) => {
  if (!quote || !items?.length) return null

  // Reconstruct the page's text the way pdf.js lays it out, recording where each
  // item starts and ends so a character range maps back to items.
  let pageText = ""
  const spans = []
  for (const item of items) {
    const start = pageText.length
    pageText += item.str
    spans.push({ start, end: pageText.length })
    // pdf.js marks line ends itself; without this, words fuse across lines.
    if (item.hasEOL) pageText += "\n"
  }

  const { normalised, offsets } = normaliseWithMap(pageText)
  const needle = normaliseQuote(quote)
  if (!needle || !normalised) return null

  // Applied before any search, not just the fallback: an exact match on a
  // fragment this short says nothing about where the finding came from.
  if (needle.length < MIN_MATCH_CHARS || needle.split(" ").length < MIN_MATCH_WORDS) return null

  let at = normalised.indexOf(needle)
  let length = needle.length

  if (at === -1) {
    // The full quote may have picked up an edit in transit. Its opening words
    // are enough to find the right place, and long enough to be distinctive.
    const prefix = needle.split(" ").slice(0, PREFIX_WORDS).join(" ")
    if (prefix.length < MIN_PREFIX_CHARS) return null
    at = normalised.indexOf(prefix)
    if (at === -1) return null
    length = prefix.length
  }

  const from = offsets[at]
  const to = offsets[Math.min(at + length - 1, offsets.length - 1)] + 1

  const hits = []
  spans.forEach((span, index) => {
    // An item counts as covered if it overlaps the range at all — partial
    // overlap at the ends highlights a word or two extra, which reads fine.
    if (span.start < to && span.end > from) hits.push(index)
  })
  return hits.length > 0 ? hits : null
}
