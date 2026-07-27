import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";

async function main() {
  // Quick database connection sanity check.
  await prisma.$queryRaw`SELECT 1`;

  const app = createApp();
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  Start QAI Shop API`);
    // eslint-disable-next-line no-console
    console.log(`  → API:     http://localhost:${config.port}/api`);
    // eslint-disable-next-line no-console
    console.log(`  → Swagger: http://localhost:${config.port}/docs\n`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Nie udało się uruchomić serwera:", err);
  process.exit(1);
});
