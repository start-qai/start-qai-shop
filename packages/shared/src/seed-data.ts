import type { CreateProductInput } from "./types.js";

/**
 * Test (seed) product data, created by the backend on first run.
 * `imageUrl` points to a single local image served by the backend at
 * /images/products/default.png, so the app works fully offline and tests stay deterministic.
 */
export interface SeedProduct extends CreateProductInput {
  /** Stable slug used as both the id and the image file name. */
  slug: string;
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "qai-mug",
    title: "Kubek",
    description:
      "Ceramiczny kubek 350 ml z logo QAI. Idealny na poranną kawę przed sesją testów eksploracyjnych.",
    price: 39.99,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
  {
    slug: "qai-tshirt",
    title: "Koszulka",
    description:
      "Bawełniana koszulka z nadrukiem 'Trust, but verify'. Miękka, oddychająca, w kolorze grafitowym.",
    price: 89.0,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
  {
    slug: "qai-hoodie",
    title: "Bluza",
    description:
      "Ciepła bluza z kapturem dla zespołu QA. Kieszeń kangurka i haftowane logo na piersi.",
    price: 179.0,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
  {
    slug: "qai-stickers",
    title: "Zestaw naklejek",
    description: "Komplet 12 winylowych naklejek na laptopa: bugi, zielone testy i AI workflow.",
    price: 19.99,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
  {
    slug: "qai-notebook",
    title: "Notatnik",
    description:
      "Notatnik A5 w kropki, 160 stron. Na scenariusze testowe, pomysły i szkice architektury.",
    price: 29.5,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
  {
    slug: "qai-bottle",
    title: "Butelka",
    description:
      "Stalowa butelka termiczna 500 ml. Utrzymuje temperaturę przez 12 godzin. Nawodnij się między buildami.",
    price: 59.0,
    currency: "PLN",
    imageUrl: "/images/products/default.png",
  },
];
