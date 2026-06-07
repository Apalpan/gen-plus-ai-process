import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// For GitHub Pages project sites the app is served from /<repo>/.
// Set BASE_PATH at build time (the deploy workflow does this automatically).
// For Vercel / local dev the default "/" is used.
const base = process.env.BASE_PATH ?? '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
