import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";
import { resetDb, seedProducts, authHeader, testProductInput } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await resetDb();
  await seedProducts();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Products endpoints authorization", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app).get("/api/products").set("Authorization", "Bearer wrong-token");
    expect(res.status).toBe(401);
  });

  it("accepts the 'Bearer' scheme case-insensitively (RFC 7235)", async () => {
    const res = await request(app)
      .get("/api/products")
      .set("Authorization", "bearer qai-shop-demo-token-2026");
    expect(res.status).toBe(200);
  });
});

describe("GET /api/products", () => {
  it("returns the seeded product list", async () => {
    const res = await request(app).get("/api/products").set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          price: expect.any(Number),
        }),
      ]),
    );
  });
});

describe("GET /api/products/:id", () => {
  it("returns a single product", async () => {
    const product = await prisma.product.create({
      data: { id: "product-read", ...testProductInput({ title: "Produkt do odczytu" }) },
    });
    const res = await request(app).get(`/api/products/${product.id}`).set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ id: product.id, title: product.title }));
  });

  it("returns 404 for a non-existent id", async () => {
    const res = await request(app).get("/api/products/nie-ma").set(authHeader);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("NOT_FOUND");
  });
});

describe("POST /api/products", () => {
  it("creates a product (201)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader)
      .send(testProductInput({ title: "Produkt utworzony", price: 49.99 }));
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe("Produkt utworzony");

    const all = await request(app).get("/api/products").set(authHeader);
    expect(all.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: res.body.id })]),
    );
  });

  it("returns 400 for invalid data (negative price)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader)
      .send(testProductInput({ price: -1 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a currency outside the contract", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader)
      .send({ ...testProductInput(), currency: "EUR" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for a too-high price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader)
      .send(testProductInput({ price: 100_000.01 }));
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/products/:id", () => {
  it("updates a product", async () => {
    const res = await request(app)
      .put("/api/products/qai-mug")
      .set(authHeader)
      .send({ price: 44.44 });
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(44.44);
  });

  it("returns 404 for a non-existent product", async () => {
    const res = await request(app).put("/api/products/nie-ma").set(authHeader).send({ price: 1 });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id", () => {
  it("deletes a product (204)", async () => {
    const product = await prisma.product.create({
      data: { id: "product-delete", ...testProductInput() },
    });
    const res = await request(app).delete(`/api/products/${product.id}`).set(authHeader);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/products/${product.id}`).set(authHeader);
    expect(check.status).toBe(404);
  });
});
