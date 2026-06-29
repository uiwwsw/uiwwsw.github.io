import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src',
  plugins: [react()],
  // Use absolute path for User Pages (root domain)
  base: '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing']
        }
      }
    },
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== 'html') {
          return deps;
        }

        return deps.filter((dependency) => {
          return !/(UniverseScene|WordCloud|three-|troika-three-text)/.test(dependency);
        });
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three']
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  },

});
