import { Link } from "react-router-dom"
import { FileText } from "lucide-react"
import ProfileMenu from "./profileMenu"

/** Shared top bar: brand and the account menu. */
const AppHeader = () => (
  <header className="shrink-0 border-b border-[#e4e1d9] bg-[#ffffff]">
    <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 lg:px-10">
      <Link to="/main" className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c6b4e]">
          <FileText className="h-5 w-5 text-[#ffffff]" strokeWidth={2.2} />
        </span>
        <span className="text-base font-semibold tracking-tight text-[#131a16]">
          TrueOffer.AI
        </span>
      </Link>

      <ProfileMenu />
    </nav>
  </header>
)

export default AppHeader
