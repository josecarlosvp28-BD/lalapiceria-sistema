import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@renderer": path.resolve(__dirname, "src/renderer"),
    },
  },
  server: {
    // En desarrollo, corre el backend PHP aparte (`php -S localhost:8000 -t php/public`)
    // y este proxy reenvía las llamadas /api hacia él.
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PHP_PORT ?? 8000}`,
        changeOrigin: true,
      },
    },
  },
});
