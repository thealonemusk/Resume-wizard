import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "/" : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"],
    // Exclude optional runtime-only packages that may include non-code files
    // (e.g. latex.js has .keep files that esbuild can't load). We load
    // latex.js dynamically at runtime with /* @vite-ignore */ so exclude it
    // from pre-bundling to avoid esbuild errors during dev.
    exclude: ["latex.js"],
  },
  plugins: [
    react(),
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // @ts-ignore
    allowedHosts: true,
  }
});
