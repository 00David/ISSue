import { defineConfig, loadEnv  } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {

  // Environment variables loaded from the parent folder
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT) || 5170,
      host: '0.0.0.0',
      proxy: {
        '/api': `http://localhost:${env.BACKEND_PORT || 4572}`
      }
    }
  }
})
