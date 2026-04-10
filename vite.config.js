import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a relative base so the built site works under GitHub Pages (repo paths),
// and with other static hosts that serve from subpaths.
export default defineConfig({
  base: './',
  plugins: [react()],
})
