import { api, errorMessage } from "./api"

// The model call alone runs ~30s on a short letter, and a long one runs longer.
// Axios has no timeout by default; this one exists so a dead connection fails
// eventually instead of leaving the button spinning forever.
export const ANALYSIS_TIMEOUT_MS = 180_000

/** Upload one PDF and get the finished report back. */
export const analyzeOfferLetter = (file, { onUploadProgress, signal } = {}) => {
  const form = new FormData()
  form.append("file", file)

  // Content-Type is deliberately not set: the browser has to add the multipart
  // boundary itself, and naming the type here strips it.
  return api
    .post("/api/upload", form, { timeout: ANALYSIS_TIMEOUT_MS, onUploadProgress, signal })
    .then((response) => response.data)
}

/** Re-open a report generated earlier, by the id the upload returned. */
export const fetchAudit = (analysisId, { signal } = {}) =>
  api.get(`/api/audit/${analysisId}`, { signal }).then((response) => response.data)

// What the backend means by each status, in the words a toast should use. The
// backend already writes user-facing `detail` strings, so the title is all we
// add — except where the status itself is the useful part.
const FAILURE_TITLES = {
  400: "Can't use that file",
  404: "Report not found",
  413: "That file is too large",
  422: "Couldn't analyse that",
  503: "Analysis unavailable",
}

/**
 * Turn an axios failure into something worth putting on screen.
 *
 * Deliberately leaks the HTTP status for anything unexpected. A toast saying
 * "something went wrong" is useless while the backend is still being wired up;
 * "[HTTP 500]" tells you which end to go and look at.
 */
export const describeFailure = (error) => {
  if (error.code === "ERR_CANCELED") return null

  if (error.code === "ECONNABORTED") {
    return {
      title: "That took too long",
      message: `The analysis didn't finish within ${ANALYSIS_TIMEOUT_MS / 1000}s. The server may still be working — try again, or check the backend logs.`,
    }
  }

  if (!error.response) {
    return {
      title: "Can't reach the server",
      message:
        "No response from the API. Is the backend running on port 8000? (uvicorn main:app --reload)",
    }
  }

  const { status } = error.response
  const detail = errorMessage(error)
  const title = FAILURE_TITLES[status]

  // A known status: the backend's own message is already the right thing to say.
  if (title) return { title, message: detail }

  // Anything else is a bug rather than a rejection, so say so plainly and name
  // the status — that is the part that shortens the debugging.
  return {
    title: `Unexpected error (HTTP ${status})`,
    message: `${detail} Check the backend logs for the traceback.`,
  }
}
