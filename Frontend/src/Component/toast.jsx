import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

// Per-variant colouring, drawn from the same palette as the auth screens.
const VARIANTS = {
  success: {
    icon: CheckCircle2,
    accent: "bg-[#0c6b4e]",
    iconColor: "text-[#0c6b4e]",
    border: "border-[#cfe3d9]",
  },
  error: {
    icon: AlertCircle,
    accent: "bg-[#c0392b]",
    iconColor: "text-[#c0392b]",
    border: "border-[#f0d3ce]",
  },
  info: {
    icon: Info,
    accent: "bg-[#131a16]",
    iconColor: "text-[#131a16]",
    border: "border-[#e4e1d9]",
  },
}

export const Toast = ({ toast, onDismiss }) => {
  const variant = VARIANTS[toast.variant] ?? VARIANTS.info
  const Icon = variant.icon

  return (
    <div
      // Errors interrupt; success and info wait for a pause in speech.
      role={toast.variant === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex w-full items-start gap-3 overflow-hidden rounded-xl border ${variant.border} bg-[#ffffff] pr-3 shadow-[0_8px_24px_-6px_rgba(19,26,22,0.18)] ${
        toast.leaving ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      {/* accent rail */}
      <span className={`w-1 self-stretch ${variant.accent}`} aria-hidden="true" />

      <Icon className={`mt-3.5 h-4 w-4 shrink-0 ${variant.iconColor}`} strokeWidth={2.3} />

      <div className="flex-1 py-3">
        {toast.title && (
          <p className="text-sm font-semibold text-[#131a16]">{toast.title}</p>
        )}
        <p
          className={`text-xs leading-relaxed text-[#131a16] ${
            toast.title ? "mt-0.5 opacity-70" : "py-0.5 opacity-85"
          }`}
        >
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="mt-3 shrink-0 text-[#131a16] opacity-35 transition-opacity hover:opacity-70"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

export const ToastViewport = ({ toasts, onDismiss }) => (
  // pointer-events-none so the empty column never blocks clicks on the page
  // underneath; each toast re-enables them for itself.
  <div className="pointer-events-none fixed top-4 right-4 left-4 z-50 flex flex-col gap-2.5 sm:left-auto sm:w-[360px]">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
)
