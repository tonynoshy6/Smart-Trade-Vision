import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  root: path.resolve("./artifacts/trading-analyzer"),
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve("./artifacts/trading-analyzer/src"),
      "@assets": path.resolve("./attached_assets"),
      "@workspace/api-client-react": path.resolve("./lib/api-client-react/src"),
      "@workspace/api-zod": path.resolve("./lib/api-zod/src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve("./dist"),
    emptyOutDir: true,
  },
});
