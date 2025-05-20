import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        worker: path.resolve(__dirname, 'server/worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]',
      },
    },
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
