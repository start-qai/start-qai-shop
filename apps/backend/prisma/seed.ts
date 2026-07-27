import { PrismaClient } from "@prisma/client";
import { SEED_PRODUCTS } from "@qai-shop/shared";

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
