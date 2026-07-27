import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Osobna baza testowa – nie dotykamy dev.db.
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      DEMO_AUTH_TOKEN: "qai-shop-demo-token-2026",
      DEMO_USERNAME: "demo",
      DEMO_PASSWORD: "demo123",
    },
    globalSetup: ["./src/__tests__/global-setup.ts"],
    // The SQLite database is a single file – run test files sequentially to avoid collisions.
    fileParallelism: false,
  },
});
