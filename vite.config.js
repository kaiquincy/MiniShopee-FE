import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'tidy-gibbon-evidently.ngrok-free.app'
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
