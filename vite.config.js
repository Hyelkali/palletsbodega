import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.MP4", "**/*.mp4", "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.svg", "**/*.gif"],
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add base URL for production
  base: "./",
  // Optimize build settings
  build: {
    outDir: "dist",
    // Using esbuild minifier which is built-in (no extra dependencies needed)
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        // Ensure proper file naming and paths
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: (id) => {
          // Create separate chunks for large dependencies
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react"
            }
            if (id.includes("firebase")) {
              return "vendor-firebase"
            }
            return "vendor" // all other node_modules
          }
        },
      },
      // Add external dependencies that should be excluded from the bundle
      external: process.env.NODE_ENV === "production" ? [] : ["lucide-react"],
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Optimize server settings
  server: {
    open: true,
    hmr: {
      overlay: true,
    },
  },
  // Add optimizeDeps to pre-bundle dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "lucide-react",
      "jspdf",
      "html2canvas",
    ],
  },
  // Add public directory configuration
  publicDir: "public",
})
