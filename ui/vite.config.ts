import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const projectSrc = path.join(projectRoot, "src"); // resolves to jarvis/src/
const ocSrc = path.join(here, "oc-src");

export default defineConfig({
  base: "/",
  publicDir: path.resolve(here, "public"),
  build: {
    outDir: path.resolve(here, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1024,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy WebSocket to the running OpenClaw gateway
      "/gateway-ws": {
        target: "ws://localhost:18789",
        ws: true,
        rewrite: (p) => p.replace(/^\/gateway-ws/, "/gateway-ws"),
      },
      // Proxy config endpoint
      "/__openclaw": {
        target: "http://localhost:18789",
      },
      // Proxy API calls
      "/api": {
        target: "http://localhost:18789",
      },
    },
  },
  plugins: [
    {
      // Stub the control-ui-config endpoint for local dev
      name: "control-ui-dev-stubs",
      configureServer(server) {
        server.middlewares.use("/__openclaw/control-ui-config.json", (_req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              basePath: "/",
              assistantName: "",
              assistantAvatar: "",
            }),
          );
        });
      },
    },
    {
      // Redirect cross-repo imports (../../../src/...) to our oc-src/ shims
      name: "openclaw-src-shim",
      resolveId(id: string, importer: string | undefined) {
        if (!importer || !id.startsWith(".")) return null;

        const resolved = path.resolve(path.dirname(importer), id);

        // If the resolved path falls inside jarvis/src/, redirect to oc-src/
        if (resolved.startsWith(projectSrc + path.sep) || resolved === projectSrc) {
          const rel = path.relative(projectSrc, resolved);
          const shimmed = path.resolve(ocSrc, rel).replace(/\.js$/, ".ts");
          return shimmed;
        }

        return null;
      },
    },
  ],
});
