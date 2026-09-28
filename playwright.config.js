import { defineConfig, devices } from "@playwright/test";
import { ESQUEMA_E2E, PUERTO_API, PUERTO_WEB } from "./e2e/config_e2e.js";

// API y web propias para los E2E (schema y puertos aparte de `npm run dev`).
// Escritorio y celular, como en DistribuCG.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  globalSetup: "./e2e/preparar_base.js",
  use: {
    baseURL: `http://localhost:${PUERTO_WEB}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npm run dev:api",
      url: `http://localhost:${PUERTO_API}/api/salud`,
      reuseExistingServer: false,
      timeout: 60_000,
      // INTENTOS_LOGIN alto: los E2E inician sesión como admin muchas veces seguidas.
      env: { PORT: String(PUERTO_API), BD_ESQUEMA: ESQUEMA_E2E, URL_FRONTEND_VERCEL: `http://localhost:${PUERTO_WEB}`, INTENTOS_LOGIN: "1000" },
    },
    {
      command: `npm run dev -w frontend -- --port ${PUERTO_WEB} --strictPort`,
      url: `http://localhost:${PUERTO_WEB}`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: { VITE_URL_API_RENDER: `http://localhost:${PUERTO_API}/api` },
    },
  ],
});
