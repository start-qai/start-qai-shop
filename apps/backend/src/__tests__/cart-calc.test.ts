import { describe, it, expect } from "vitest";
import { calculateCart, round2, toCartItem } from "../lib/cart-calc.js";
import type { Product } from "@qai-shop/shared";

const product = (over: Partial<Product> = {}): Product => ({
  id: "p1",
  title: "Kubek",
  description: "opis",
  price: 10,
  currency: "PLN",
  imageUrl: "/img.svg",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("round2", () => {
  it("rounds to 2 decimal places", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(79.985)).toBe(79.99);
    expect(round2(10)).toBe(10);
  });
});

describe("toCartItem", () => {
  it("computes lineTotal as price * quantity", () => {
    const item = toCartItem(product({ price: 39.99 }), 2);
    expect(item.quantity).toBe(2);
    expect(item.lineTotal).toBe(79.98);
    expect(item.title).toBe("Kubek");
  });
});

describe("calculateCart", () => {
  it("returns an empty cart with the default currency", () => {
    const cart = calculateCart([]);
    expect(cart.totalItems).toBe(0);
    expect(cart.totalPrice).toBe(0);
    expect(cart.currency).toBe("PLN");
    expect(cart.items).toEqual([]);
  });

  it("sums quantities and prices across multiple items", () => {
    const cart = calculateCart([
      { product: product({ id: "a", price: 39.99 }), quantity: 2 },
      { product: product({ id: "b", price: 179 }), quantity: 1 },
    ]);
    expect(cart.totalItems).toBe(3);
    expect(cart.totalPrice).toBe(258.98);
    expect(cart.items).toHaveLength(2);
  });

  it("rejects a currency other than the supported one", () => {
    expect(() =>
      calculateCart([
        { product: { ...product(), currency: "EUR" } as unknown as Product, quantity: 1 },
      ]),
    ).toThrow("Koszyk obsługuje tylko walutę PLN");
  });
});
