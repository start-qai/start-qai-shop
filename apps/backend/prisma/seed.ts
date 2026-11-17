import { PrismaClient } from "@prisma/client";
import { SEED_ORDERS, SEED_PRODUCTS } from "@qai-shop/shared";

const prisma = new PrismaClient();

/**
 * Seeds test data. Idempotent – uses `upsert` on a fixed id (slug),
 * so repeated runs do not create duplicates.
 */
async function main() {
  // eslint-disable-next-line no-console
  console.log("Seeduję produkty...");

  for (const p of SEED_PRODUCTS) {
    const { slug, ...data } = p;
    await prisma.product.upsert({
      where: { id: slug },
      update: { ...data },
      create: { id: slug, ...data },
    });
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${p.title}`);
  }

  const count = await prisma.product.count();
  // eslint-disable-next-line no-console
  console.log(`Gotowe. Produktów w bazie: ${count}`);

  // Seed orders (gRPC OrderService) – every run restores them to their initial state.
  // Other orders (e.g. created via REST checkout) are left untouched.
  // eslint-disable-next-line no-console
  console.log("Seeduję zamówienia...");
  for (const o of SEED_ORDERS) {
    const data = {
      status: o.status,
      trackingNumber: o.trackingNumber,
      totalPrice: Math.round(o.items.reduce((sum, it) => sum + it.lineTotal, 0) * 100) / 100,
      currency: "PLN",
      itemsJson: JSON.stringify(o.items),
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
    };
    await prisma.order.upsert({ where: { id: o.id }, update: data, create: { id: o.id, ...data } });
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${o.id} (${o.status})`);
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seed nie powiódł się:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
