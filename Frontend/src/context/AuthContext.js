import { createContext } from "react"

// The context object lives apart from the provider component so that
// AuthProvider.jsx exports only components — mixing the two breaks fast refresh.
export const AuthContext = createContext(null)
