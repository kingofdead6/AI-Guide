import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` keeps every asset path relative, so the built site works from any folder or static host.
// The app calls the deployed API by default (src/lib/api.ts). With VITE_API_URL=/api, calls to /api are
// forwarded to a local server in ../server instead (port 4000 by default).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: process.env.API_PROXY || 'http://localhost:4000', changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom', 'zustand'] },
      },
    },
  },
});
