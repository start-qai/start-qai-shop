import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./prisma.js";
import { startGrpcServer } from "./grpc/server.js";

async function main() {
  // Quick database connection sanity check.
  await prisma.$queryRaw`SELECT 1`;

  const app = createApp();
  await new Promise<void>((resolve) => app.listen(config.port, resolve));

  // gRPC (OrderService) runs in the same process as the REST API.
  const grpc = await startGrpcServer(config.grpcHost, config.grpcPort);

  // eslint-disable-next-line no-console
  console.log(`\n  Start QAI Shop API`);
  // eslint-disable-next-line no-console
  console.log(`  → API:     http://localhost:${config.port}/api`);
  // eslint-disable-next-line no-console
  console.log(`  → Swagger: http://localhost:${config.port}/docs`);
  // eslint-disable-next-line no-console
  console.log(`  → gRPC:    localhost:${grpc.port} (OrderService, reflection włączone)\n`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Nie udało się uruchomić serwera:", err);
  process.exit(1);
});
