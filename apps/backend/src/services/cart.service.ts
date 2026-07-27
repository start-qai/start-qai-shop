import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { calculateCart, type RawCartItem } from "../lib/cart-calc.js";
import { toProductDto } from "../lib/mappers.js";
import type { Cart } from "@qai-shop/shared";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getCart(db: DbClient = prisma): Promise<Cart> {
  const rows = await db.cartItem.findMany({
    where: { cartId: config.cartId },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  const rawItems: RawCartItem[] = rows.map((row) => ({
    product: toProductDto(row.product),
    quantity: row.quantity,
  }));

  return calculateCart(rawItems);
}
