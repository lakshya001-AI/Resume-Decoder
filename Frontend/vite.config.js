import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // This file runs in Node, so import.meta.env is not available here.
  // loadEnv reads .env / .env.[mode] and keeps only VITE_-prefixed keys.
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Forward /api/* to the FastAPI server so browser calls stay same-origin.
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
