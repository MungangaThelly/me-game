import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // ✅ Explicitly set output folder
    assetsInlineLimit: 4096,
    rollupOptions: {
      // Include service worker in build
      input: {
        main: 'index.html',
        sw: 'public/sw.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'sw' ? 'sw.js' : '[name]-[hash].js'
        }
      }
    }
  },
  server: {
    // Enable HTTPS for PWA features in development
    https: false, // Set to true if you need HTTPS features
    host: true // Allow external connections for mobile testing
  },
  // Ensure service worker is served correctly
  publicDir: 'public'
})
