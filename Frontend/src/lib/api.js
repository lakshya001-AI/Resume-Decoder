import axios from "axios"

// Empty in dev, so calls stay relative and go through the Vite proxy. In a
// deployed build this is the backend's own origin, baked in at build time.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' })
