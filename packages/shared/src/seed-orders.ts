import type { CartItem } from "./types.js";

/** Seed orders – one order per status, with fixed ids and dates. */
export interface SeedOrder {
  id: string;
  status: "PAID" | "SHIPPED" | "DELIVERED";
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

const IMAGE = "/images/products/default.png";

const item = (
  productId: string,
  title: string,
  quantity: number,
  price: number,
  lineTotal: number,
): CartItem => ({ productId, title, price, currency: "PLN", imageUrl: IMAGE, quantity, lineTotal });

export const SEED_ORDERS: SeedOrder[] = [
  {
    id: "order-paid-1",
    status: "PAID",
    trackingNumber: null,
    createdAt: "2026-01-03T10:00:00.000Z",
    updatedAt: "2026-01-03T10:00:00.000Z",
    items: [
      item("qai-mug", "Kubek", 2, 35.99, 71.98),
      item("qai-stickers", "Zestaw naklejek", 1, 17.99, 17.99),
    ],
  },
  {
    id: "order-shipped-1",
    status: "SHIPPED",
    trackingNumber: "PL-TRACK-0001",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T15:00:00.000Z",
    items: [item("qai-tshirt", "Koszulka", 1, 79.0, 79.0)],
  },
  {
    id: "order-delivered-1",
    status: "DELIVERED",
    trackingNumber: "PL-TRACK-0002",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T18:00:00.000Z",
    items: [
      item("qai-hoodie", "Bluza", 1, 159.0, 159.0),
      item("qai-notebook", "Notatnik", 2, 26.5, 53.0),
    ],
  },
];
