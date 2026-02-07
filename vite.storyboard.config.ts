/**
 * Vite Configuration for Storyboard UI
 *
 * Separate config for the video storyboard application.
 * Run with: npm run storyboard
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3002,
    open: '/storyboard.html',
  },
  build: {
    outDir: 'dist-storyboard',
    rollupOptions: {
      input: {
        storyboard: path.resolve(__dirname, 'storyboard.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['zustand', 'immer'],
  },
});
