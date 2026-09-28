import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Librerías en archivos aparte: casi nunca cambian, así que tras cada publicación el
        // visitante vuelve a descargar solo el código de la app (el resto queda en caché, ver vercel.json).
        manualChunks(id) {
          // Vite usa "/" en las rutas, también en Windows.
          if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return "lib-react";
          if (/node_modules\/(@tanstack|axios)\//.test(id)) return "lib-datos";
          if (/node_modules\/(zod|react-hook-form|@hookform)\//.test(id)) return "lib-formularios";
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    css: false,
    // Node 25+ trae un localStorage experimental propio que tapa al de jsdom.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
  },
});
