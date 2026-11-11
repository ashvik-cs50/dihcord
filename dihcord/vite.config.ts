import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Tauri-compatible settings for future desktop builds
  clearScreen: false,
  server: {
    strictPort: true,
    port: 1420,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@convex/_generated': path.resolve(dirname, '../convex/_generated'),
      '@': path.resolve(dirname, 'src'),
    },
  },
  build: {
    target: 'es2021',
    chunkSizeWarningLimit: 1200,
  },
})
