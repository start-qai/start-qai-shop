import { prisma } from "../prisma.js";
import { SEED_PRODUCTS, type CreateProductInput } from "@qai-shop/shared";

/** Clears all tables (order matters due to relations). */
export async function resetDb(): Promise<void> {
  await prisma.cartItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
}

/** Seeds the database with seed products (id = slug). */
export async function seedProducts(): Promise<void> {
  for (const p of SEED_PRODUCTS) {
    const { slug, ...data } = p;
    await prisma.product.create({ data: { id: slug, ...data } });
  }
}

export const TOKEN = "qai-shop-demo-token-2026";
export const authHeader = { Authorization: `Bearer ${TOKEN}` };

export const testProductInput = (
  overrides: Partial<CreateProductInput> = {},
): CreateProductInput => ({
  title: "Produkt testowy",
  description: "Opis produktu testowego",
  price: 12.34,
  currency: "PLN",
  imageUrl: "/images/products/default.png",
  ...overrides,
});
