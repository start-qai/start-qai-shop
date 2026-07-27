import type { Product as PrismaProduct } from "@prisma/client";
import { SUPPORTED_CURRENCY, type Product } from "@qai-shop/shared";

/** Maps a Prisma record to a Product DTO (dates as ISO strings). */
export function toProductDto(p: PrismaProduct): Product {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    currency: SUPPORTED_CURRENCY,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
