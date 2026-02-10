import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // ✅ Required for correct asset resolution on Vercel
  base: "/",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },

  // ✅ Dev server (local only)
  server: {
    port: 5173,
    strictPort: true,
  },

  // ✅ Prevents blank screen on refresh (React Router)
  preview: {
    port: 4173,
    strictPort: true,
  },
});
