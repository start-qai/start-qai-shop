import express, { type Express } from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { buildOpenApiDocument } from "./openapi.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter } from "./routes/checkout.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

/** Creates and configures an Express instance (without listening) – also used in tests. */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.frontendOrigin }));
  app.use(express.json());

  // Static assets (product images) – /images/products/<slug>.png
  app.use(express.static(publicDir));

  const openApiDocument = buildOpenApiDocument();
  app.get("/docs/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: "Start QAI Shop API – Swagger",
    }),
  );

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/checkout", checkoutRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
