import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  base: '/Dokkaebi_FC/',
  plugins: [vue()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase-vendor'
            if (
              id.includes('/vue/') ||
              id.includes('/vue-router/') ||
              id.includes('/pinia/') ||
              id.includes('/@vueuse/')
            ) return 'vue-vendor'
          }
          if (id.includes('/src/views/admin/')) return 'admin'
          if (
            id.includes('/src/utils/squadPositions') ||
            id.includes('/src/utils/matchVenue')
          ) return 'compat'
        }
      }
    }
  }
})
