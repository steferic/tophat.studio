/**
 * Vite Configuration for 3D Scene Editor
 *
 * Separate config for running the editor as a standalone application.
 * Run with: npm run editor
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 3001,
    open: '/editor.html',
  },
  build: {
    outDir: 'dist-editor',
    rollupOptions: {
      input: {
        editor: path.resolve(__dirname, 'editor.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'zustand'],
  },
});
