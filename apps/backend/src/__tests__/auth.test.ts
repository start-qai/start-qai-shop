import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "demo", password: "demo123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("qai-shop-demo-token-2026");
    expect(res.body.user.username).toBe("demo");
  });

  it("returns 401 for a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "demo", password: "złe" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ username: "demo" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BAD_REQUEST");
  });

  it("returns 400 (not 500) for malformed JSON in the body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("not-json");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("BAD_REQUEST");
  });
});
