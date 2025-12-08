import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  plugins: [react()],
  // Use relative asset paths so the bundle works on GitHub Pages regardless of the
  // configured root (e.g., Actions deployments or docs/ publishing).
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
