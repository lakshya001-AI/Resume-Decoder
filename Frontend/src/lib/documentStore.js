/**
 * Keeps the uploaded offer letter in the browser, and nowhere else.
 *
 * The backend is sent the PDF's text and never keeps the bytes, which is what
 * makes "your document is only used to generate your report" true as written.
 * But highlighting a quote needs the original file, so it is parked here — in
 * this browser, on this device, under the analysis id.
 *
 * Every call degrades rather than throws. IndexedDB is unavailable in some
 * private-browsing modes and blocked whenever site data is, and a report that
 * cannot show the source PDF is still a perfectly good report.
 */

const DB_NAME = "trueoffer.documents"
const DB_VERSION = 1
const STORE = "offerLetters"

// Old letters are other people's salary details sitting in a browser. Keep only
// what a user might plausibly reopen, and sweep the rest on every write.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_ENTRIES = 5

const openDatabase = () =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"))
      return
    }

    let request
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch (error) {
      // Throws outright when site data is blocked, rather than failing async.
      reject(error)
      return
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "analysisId" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    // Fires when another tab holds an old version open; treat as unavailable.
    request.onblocked = () => reject(new Error("IndexedDB blocked"))
  })

const runTransaction = async (mode, work) => {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, mode)
      const store = transaction.objectStore(STORE)
      let outcome
      // Resolve on transaction completion, not on request success: in a
      // readwrite transaction the write is not durable until it commits.
      transaction.oncomplete = () => resolve(outcome)
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
      work(store, (value) => {
        outcome = value
      })
    })
  } finally {
    db.close()
  }
}

/** Drop anything stale or beyond the cap. Runs inside the caller's transaction. */
const prune = (store, keepId) => {
  const request = store.getAll()
  request.onsuccess = () => {
    const entries = request.result ?? []
    const cutoff = Date.now() - MAX_AGE_MS
    const survivors = entries
      .filter((entry) => entry.analysisId !== keepId && entry.savedAt >= cutoff)
      .sort((a, b) => b.savedAt - a.savedAt)

    for (const entry of entries) {
      const stale = entry.savedAt < cutoff
      const overflow = survivors.indexOf(entry) >= MAX_ENTRIES - 1
      if (entry.analysisId !== keepId && (stale || overflow)) {
        store.delete(entry.analysisId)
      }
    }
  }
}

/** Park the PDF against this analysis id. Resolves false if storage refused. */
export const saveDocument = async (analysisId, file) => {
  try {
    const bytes = await file.arrayBuffer()
    await runTransaction("readwrite", (store) => {
      store.put({
        analysisId,
        fileName: file.name,
        savedAt: Date.now(),
        // An ArrayBuffer survives the structured clone; a File does not, in
        // every browser we care about.
        bytes,
      })
      prune(store, analysisId)
    })
    return true
  } catch {
    return false
  }
}

/** The stored PDF bytes for this report, or null if we do not have them. */
export const loadDocument = async (analysisId) => {
  try {
    const entry = await runTransaction("readonly", (store, done) => {
      const request = store.get(analysisId)
      request.onsuccess = () => done(request.result)
    })
    return entry?.bytes ?? null
  } catch {
    return null
  }
}

/** Forget one stored letter — used when the user asks us to. */
export const forgetDocument = async (analysisId) => {
  try {
    await runTransaction("readwrite", (store) => store.delete(analysisId))
    return true
  } catch {
    return false
  }
}
