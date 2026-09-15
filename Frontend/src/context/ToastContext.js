import { createContext } from "react"

// Split from the provider component so ToastProvider.jsx exports only
// components, which is what fast refresh needs.
export const ToastContext = createContext(null)
