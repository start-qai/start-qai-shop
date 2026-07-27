import { config as loadEnv } from "dotenv";
import { DEMO_AUTH_TOKEN, DEMO_CREDENTIALS } from "@qai-shop/shared";

loadEnv();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DEMO_AUTH_TOKEN ?? DEMO_AUTH_TOKEN,
  credentials: {
    username: process.env.DEMO_USERNAME ?? DEMO_CREDENTIALS.username,
    password: process.env.DEMO_PASSWORD ?? DEMO_CREDENTIALS.password,
  },
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  /** Fixed cart id – the demo app has a single user. */
  cartId: "demo",
} as const;
