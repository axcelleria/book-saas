import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 1000, // Increase size limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['materialize-css'],
          'utils': ['uuid', 'file-saver']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    },
    // Add this configuration for client-side routing
    historyApiFallback: {
      disableDotRule: true
    }
  }
})