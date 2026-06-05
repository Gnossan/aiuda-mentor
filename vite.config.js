import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': 'https://aiuda-mentor-backend.vercel.app'
    }
  }
})
