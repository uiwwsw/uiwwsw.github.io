import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  plugins: [react()],
  // Use absolute path for User Pages (root domain)
  base: "/",
  publicDir: "../public",
  build: {
    manifest: true,
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Shared JSX/CJS/preload helpers must not land in the 3D chunk:
          // otherwise the supposedly lazy scene blocks initial React execution.
          if (
            /commonjsHelpers|vite\/preload-helper/.test(id) ||
            /\/node_modules\/(react|react-dom|react-is|scheduler)(\/|$)/.test(
              id,
            )
          )
            return "vendor";
          if (/\/node_modules\/(three\/|@react-three\/)/.test(id))
            return "three";
        },
      },
    },
    minify: "terser",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true,
      resolveDependencies(_filename, deps, context) {
        if (context.hostType !== "html") {
          return deps;
        }

        return deps.filter((dependency) => {
          return !/(UniverseScene|WordCloud|three-|troika-three-text)/.test(
            dependency,
          );
        });
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "three"],
  },
  server: { headers: { "Cache-Control": "no-store" } },
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === "js") {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    },
  },
});
