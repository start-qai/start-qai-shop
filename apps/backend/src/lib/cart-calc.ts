import { SUPPORTED_CURRENCY, type Cart, type CartItem, type Product } from "@qai-shop/shared";

/** Round to 2 decimal places (avoids floating-point errors). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface RawCartItem {
  product: Product;
  quantity: number;
}

export function toCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    title: product.title,
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    quantity,
    lineTotal: round2(product.price * quantity),
  };
}

export function calculateCart(rawItems: RawCartItem[]): Cart {
  const items = rawItems.map((it) => toCartItem(it.product, it.quantity));
  const hasUnsupportedCurrency = items.some((it) => it.currency !== SUPPORTED_CURRENCY);
  if (hasUnsupportedCurrency) {
    throw new Error(`Koszyk obsługuje tylko walutę ${SUPPORTED_CURRENCY}`);
  }
  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalPrice = round2(items.reduce((sum, it) => sum + it.lineTotal, 0));
  const currency = SUPPORTED_CURRENCY;

  return { items, totalItems, totalPrice, currency };
}
