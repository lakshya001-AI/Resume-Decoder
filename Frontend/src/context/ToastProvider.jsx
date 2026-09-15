import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ToastViewport } from "../Component/toast"
import { ToastContext } from "./ToastContext"

const DEFAULT_DURATION = 4500
// How long the leave animation runs before the toast is dropped from state.
const LEAVE_DURATION = 160
// Older toasts are pushed out rather than letting the stack grow off-screen.
const MAX_VISIBLE = 3

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  // Every pending timeout, so none of them fire after unmount.
  const timers = useRef(new Map())
  const nextId = useRef(0)

  const clearTimer = useCallback((id) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const remove = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((current) => current.filter((toast) => toast.id !== id))
    },
    [clearTimer],
  )

  /** Play the leave animation, then drop the toast. */
  const dismiss = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
      )
      timers.current.set(
        id,
        setTimeout(() => remove(id), LEAVE_DURATION),
      )
    },
    [clearTimer, remove],
  )

  const push = useCallback(
    (message, { variant = "info", title = "", duration = DEFAULT_DURATION } = {}) => {
      if (!message) return null

      const id = ++nextId.current
      setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, message, variant, title }])

      // duration: 0 means "stay until dismissed".
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss],
  )

  // Copied into a local so cleanup reads the same Map the effect captured.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, options) => push(message, { ...options, variant: "success" }),
      error: (message, options) => push(message, { ...options, variant: "error" }),
      info: (message, options) => push(message, { ...options, variant: "info" }),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
