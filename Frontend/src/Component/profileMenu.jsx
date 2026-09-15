import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, Mail, ShieldCheck } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { useToast } from "../context/useToast"

const PROVIDER_LABELS = { password: "Email & password", google: "Google" }

const initialsOf = (user) =>
  (user?.full_name || user?.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

const Avatar = ({ user, className = "h-9 w-9", textClass = "text-xs" }) =>
  user?.avatar_url ? (
    <img src={user.avatar_url} alt="" className={`${className} rounded-full object-cover`} />
  ) : (
    <span
      className={`${className} ${textClass} flex items-center justify-center rounded-full bg-[#e3efe8] font-semibold text-[#0c6b4e]`}
    >
      {initialsOf(user)}
    </span>
  )

/** Avatar button in the navbar that opens the account details and log out. */
const ProfileMenu = () => {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  // Close on an outside click or Escape — a dropdown that only closes by
  // re-clicking the trigger feels broken.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    toast.success("You have been logged out.", { title: "Signed out" })
    navigate("/", { replace: true })
  }

  const providers = (user?.auth_providers || [])
    .map((name) => PROVIDER_LABELS[name] || name)
    .join(" · ")

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border py-1 pr-2.5 pl-1 transition-colors ${
          open
            ? "border-[#0c6b4e] bg-[#ffffff]"
            : "border-[#e4e1d9] bg-[#ffffff] hover:border-[#cfe3d9]"
        }`}
      >
        <Avatar user={user} className="h-8 w-8" textClass="text-[11px]" />
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-[#131a16] sm:block">
          {user?.full_name?.split(" ")[0] || "Account"}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#131a16] opacity-50 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-toast-in absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-[#e4e1d9] bg-[#ffffff] shadow-[0_12px_32px_-8px_rgba(19,26,22,0.22)]"
        >
          {/* who is signed in */}
          <div className="flex items-center gap-3 border-b border-[#e4e1d9] p-4">
            <Avatar user={user} className="h-11 w-11" textClass="text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#131a16]">
                {user?.full_name || "Your account"}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[#131a16] opacity-60">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          {providers && (
            <div className="flex items-start gap-2 border-b border-[#e4e1d9] px-4 py-3">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[#0c6b4e]" strokeWidth={2.3} />
              <p className="text-xs leading-relaxed text-[#131a16] opacity-60">
                Signed in with <span className="font-medium opacity-100">{providers}</span>
              </p>
            </div>
          )}

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-[#c0392b] transition-colors hover:bg-[#fdf2f0]"
            >
              <LogOut className="h-4 w-4" strokeWidth={2.2} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
