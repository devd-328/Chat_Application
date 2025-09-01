import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: "localhost",  // ✅ ensures it only binds to local machine
    port: 5173,         // ✅ you can change to 5174 if 5173 feels stuck
    strictPort: true,   // ✅ avoids auto-switching ports
  },
})
