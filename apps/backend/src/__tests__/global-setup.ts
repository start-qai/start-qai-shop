import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

/**
 * Global setup for integration tests:
 * creates a clean test database schema (test.db) before running the tests.
 */
export default function setup() {
  const env = { ...process.env, DATABASE_URL: "file:./prisma/test.db" };
  execSync("prisma db push --force-reset --skip-generate", {
    stdio: "ignore",
    env,
  });

  return () => {
    try {
      rmSync("./prisma/test.db", { force: true });
      rmSync("./prisma/test.db-journal", { force: true });
    } catch {
      /* ignore */
    }
  };
}
