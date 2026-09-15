import { useNavigate } from "react-router-dom"
import { FileText, LogOut } from "lucide-react"
import { useAuth } from "../context/useAuth"
import { useToast } from "../context/useToast"

const MainPage = () => {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success("You have been logged out.", { title: "Signed out" })
    // replace, so Back cannot return to the signed-in page.
    navigate("/", { replace: true })
  }

  const initials = (user?.full_name || user?.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f4f0c1]">
      {/* ---------------- Header ---------------- */}
      <header className="flex items-center justify-between border-b border-[#e4e1d9] bg-[#ffffff] px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c6b4e]">
            <FileText className="h-5 w-5 text-[#ffffff]" strokeWidth={2.2} />
          </span>
          <span className="text-lg font-semibold tracking-tight text-[#131a16]">
            TrueOffer.AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3efe8] text-xs font-semibold text-[#0c6b4e]">
              {initials}
            </span>
          )}
          <span className="hidden text-sm text-[#131a16] opacity-70 sm:inline">
            {user?.email}
          </span>
        </div>
      </header>

      {/* ---------------- Centered body ---------------- */}
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#131a16] sm:text-3xl">
            Welcome{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#131a16] opacity-60">
            You&apos;re signed in to TrueOffer.AI. Offer-letter analysis lands here next.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0c6b4e] px-6 py-3 text-sm font-semibold text-[#ffffff] transition-opacity hover:opacity-90"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
            Log out
          </button>
        </div>
      </main>
    </div>
  )
}

export default MainPage
