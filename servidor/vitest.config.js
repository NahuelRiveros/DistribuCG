import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.js"],
    env: { NODE_ENV: "test" },
    globalSetup: ["./tests/preparar_base.js"],
    // Todos los tests comparten la misma base de test: uno a la vez.
    fileParallelism: false,
  },
});
