import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: '/cards.html',
  },
  build: {
    rollupOptions: {
      input: 'cards.html',
    },
    outDir: 'dist-cards',
  },
});
