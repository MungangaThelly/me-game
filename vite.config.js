import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096
  },
  server: {
    // Enable HTTPS for PWA features in development
    https: false, // Set to true if you need HTTPS features
    host: true // Allow external connections for mobile testing
  },
  // Ensure service worker is served correctly
  publicDir: 'public'
})
