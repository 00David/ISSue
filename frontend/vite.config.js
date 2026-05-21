import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(env.VITE_FRONTEND_PORT) || 5170,
      host: env.VITE_HOST || 'localhost',
      proxy: {
        '/api': `http://${env.VITE_HOST || 'localhost'}:${env.VITE_BACKEND_PORT || 4572}`
      }
    }
  }
})