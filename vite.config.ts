import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Framer Motion — animações
          if (id.includes("framer-motion")) return "chunk-framer";
          // PDF libs — pesadas e raramente usadas no carregamento inicial
          if (
            id.includes("jspdf") ||
            id.includes("jspdf-autotable") ||
            id.includes("pdfjs-dist")
          ) return "chunk-pdf";
          // Dados / planilhas
          if (
            id.includes("recharts") ||
            id.includes("xlsx") ||
            id.includes("papaparse")
          ) return "chunk-data";
          // Supabase
          if (id.includes("@supabase")) return "chunk-supabase";
          // Radix UI — componentes headless
          if (id.includes("@radix-ui")) return "chunk-radix";
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) return "chunk-react";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
  },
}));

