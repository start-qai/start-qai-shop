import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";
import { resetDb, authHeader, testProductInput } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Cart", () => {
  const createProduct = (id: string, price = 39.99) =>
    prisma.product.create({
      data: { id, ...testProductInput({ price }) },
    });

  it("starts empty", async () => {
    const res = await request(app).get("/api/cart").set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(0);
    expect(res.body.items).toEqual([]);
  });

  it("adds a product and sums the total", async () => {
    const product = await createProduct("cart-add", 39.99);
    const res = await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.totalItems).toBe(2);
    expect(res.body.totalPrice).toBe(79.98);
  });

  it("increments the quantity when re-adding the same product", async () => {
    const product = await createProduct("cart-increment");
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 1 });
    const res = await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 3 });
    expect(res.body.totalItems).toBe(4);
  });

  it("returns 404 when adding a non-existent product", async () => {
    const res = await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: "nie-ma", quantity: 1 });
    expect(res.status).toBe(404);
  });

  it("changes an item quantity (PATCH)", async () => {
    const product = await createProduct("cart-patch");
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 2 });
    const res = await request(app)
      .patch(`/api/cart/${product.id}`)
      .set(authHeader)
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(5);
  });

  it("rejects setting quantity to 0 (removal only via DELETE)", async () => {
    const product = await createProduct("cart-zero");
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 2 });
    const res = await request(app)
      .patch(`/api/cart/${product.id}`)
      .set(authHeader)
      .send({ quantity: 0 });
    expect(res.status).toBe(400);
    // Item remains untouched in the cart.
    const cart = await request(app).get("/api/cart").set(authHeader);
    expect(cart.body.totalItems).toBe(2);
  });

  it("removes a single item (DELETE)", async () => {
    const product = await createProduct("cart-delete");
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 1 });
    const res = await request(app).delete(`/api/cart/${product.id}`).set(authHeader);
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(0);
  });

  it("clears the whole cart (DELETE /api/cart)", async () => {
    const first = await createProduct("cart-clear-a");
    const second = await createProduct("cart-clear-b");
    await request(app).post("/api/cart").set(authHeader).send({ productId: first.id, quantity: 1 });
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: second.id, quantity: 1 });
    const res = await request(app).delete("/api/cart").set(authHeader);
    expect(res.body.totalItems).toBe(0);
  });

  it("rejects a too-large quantity", async () => {
    const product = await createProduct("cart-limit");
    const res = await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 100 });
    expect(res.status).toBe(400);
  });
});

describe("Checkout", () => {
  const createProduct = (id: string, price = 39.99) =>
    prisma.product.create({
      data: { id, ...testProductInput({ price }) },
    });

  it("returns 400 when the cart is empty", async () => {
    const res = await request(app).post("/api/checkout").set(authHeader);
    expect(res.status).toBe(400);
  });

  it("finalizes the purchase and clears the cart", async () => {
    const product = await createProduct("checkout-product", 39.99);
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: product.id, quantity: 2 });
    const res = await request(app).post("/api/checkout").set(authHeader);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PAID");
    expect(res.body.orderId).toBeTruthy();
    expect(res.body.totalPrice).toBe(79.98);

    const cart = await request(app).get("/api/cart").set(authHeader);
    expect(cart.body.totalItems).toBe(0);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: res.body.orderId } });
    expect(JSON.parse(order.itemsJson)).toEqual([
      expect.objectContaining({ productId: product.id, quantity: 2, lineTotal: 79.98 }),
    ]);
  });

  it("requires authorization", async () => {
    const res = await request(app).post("/api/checkout");
    expect(res.status).toBe(401);
  });
});
