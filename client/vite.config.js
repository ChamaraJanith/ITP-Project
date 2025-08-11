import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    https: false, // Disable HTTPS for development
    cors: true
  },
  base: './', // Ensure relative paths for assets
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
