import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    https: false, // NOTE: camera access needs HTTPS in production (Vercel/Netlify give this free)
  },
})
