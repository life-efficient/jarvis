import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/setup": "http://localhost:3000",
      "/healthz": "http://localhost:3000",
      "/gateway-ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
});
