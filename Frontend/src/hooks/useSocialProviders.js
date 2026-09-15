import { useEffect, useState } from "react"
import { api } from "../lib/api"

/**
 * Which social logins the backend actually has credentials for.
 *
 * Defaults to enabled so the buttons are never disabled by a slow or failed
 * check — a click then just surfaces the backend's own 503 message.
 */
export const useSocialProviders = () => {
  const [providers, setProviders] = useState({ google: true })

  useEffect(() => {
    let cancelled = false
    api
      .get("/api/auth/providers")
      .then(({ data }) => {
        if (!cancelled) setProviders(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return providers
}
