// Mirrors the API's password rules, so the user hears about a bad password
// before the round-trip rather than after. Shared by the signup and reset
// screens so the two cannot disagree.

// bcrypt hashes only the first 72 bytes, and the API rejects anything longer.
export const MAX_PASSWORD_LENGTH = 72

export const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"]

/** Score a password 0–4: the API's rules, plus credit for length and symbols. */
export const scorePassword = (password) => {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  return score
}

/** The first thing wrong with a password, or null if it passes. */
export const validatePassword = (password) => {
  if (!password) return "Create a password."
  if (password.length < 8) return "Use at least 8 characters."
  if (password.length > MAX_PASSWORD_LENGTH)
    return `Use at most ${MAX_PASSWORD_LENGTH} characters.`
  if (!/[a-zA-Z]/.test(password)) return "Include at least one letter."
  if (!/\d/.test(password)) return "Include at least one number."
  return null
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
