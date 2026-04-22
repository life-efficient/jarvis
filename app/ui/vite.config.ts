import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// In Docker, nginx handles proxying — this config is for local dev only.
// Override the gateway origin with VITE_GATEWAY_ORIGIN env var if needed.
const gatewayOrigin = process.env.VITE_GATEWAY_ORIGIN ?? "http://localhost:18789"
const gatewayWsOrigin = gatewayOrigin.replace(/^http/, "ws")

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/gateway-ws": { target: gatewayWsOrigin, ws: true },
      "/api":         { target: gatewayOrigin },
      "/__openclaw":  { target: gatewayOrigin },
    },
  },
})
