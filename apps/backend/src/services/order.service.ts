import type { Order as PrismaOrder } from "@prisma/client";
import type { CartItem } from "@qai-shop/shared";
import { prisma } from "../prisma.js";
import { round2 } from "../lib/cart-calc.js";
import { emitOrderStatusChanged } from "../lib/order-events.js";
import {
  OrderError,
  validateTransition,
  type OrderStatus,
  type UpdateArgs,
} from "../lib/order-status.js";

/** Order line as exposed by the order API. */
export interface OrderLine {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderView {
  id: string;
  status: OrderStatus;
  items: OrderLine[];
  totalItems: number;
  totalPrice: number;
  currency: string;
  trackingNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function parseItems(itemsJson: string): OrderLine[] {
  const items = JSON.parse(itemsJson) as CartItem[];
  return items.map((it) => ({
    productId: it.productId,
    title: it.title,
    quantity: it.quantity,
    price: it.price,
    lineTotal: it.lineTotal,
  }));
}

function buildView(order: PrismaOrder, items: OrderLine[]): OrderView {
  return {
    id: order.id,
    status: order.status as OrderStatus,
    items,
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
    totalPrice: round2(items.reduce((sum, it) => sum + it.lineTotal, 0)),
    currency: order.currency,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toOrderView(order: PrismaOrder): OrderView {
  return buildView(order, parseItems(order.itemsJson));
}

export async function findOrder(orderId: string): Promise<PrismaOrder | null> {
  return prisma.order.findUnique({ where: { id: orderId } });
}

/** Single order by id. */
export async function getOrderDetails(orderId: string): Promise<OrderView> {
  const order = await findOrder(orderId);
  if (!order) {
    throw OrderError.notFound(orderId);
  }

  const items = parseItems(order.itemsJson);
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((it) => it.productId) } },
  });
  const priceById = new Map(products.map((p) => [p.id, p.price]));

  const lines = items.map((it) => {
    const price = priceById.get(it.productId) ?? it.price;
    return { ...it, price, lineTotal: round2(price * it.quantity) };
  });

  return buildView(order, lines);
}

/** All orders, newest first (ties broken by id, descending). */
export async function listOrders(status?: OrderStatus): Promise<OrderView[]> {
  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return orders.map(toOrderView);
}

/**
 * Moves an order to the next status. Arguments must already be validated (validateUpdateArgs).
 * Order of checks: existence (NOT_FOUND) -> lifecycle transition (FAILED_PRECONDITION).
 */
export async function updateOrderStatus(args: UpdateArgs): Promise<OrderView> {
  const order = await findOrder(args.orderId);
  if (!order) {
    throw OrderError.notFound(args.orderId);
  }
  const current = order.status as OrderStatus;
  validateTransition(current, args.status);

  // Conditional write: succeeds only if the status has not changed since it was read,
  // so two concurrent requests cannot both move the order (the loser gets FAILED_PRECONDITION).
  const { count } = await prisma.order.updateMany({
    where: { id: args.orderId, status: current },
    data: {
      status: args.status,
      ...(args.trackingNumber !== null ? { trackingNumber: args.trackingNumber } : {}),
    },
  });
  if (count === 0) {
    throw OrderError.failedPrecondition(
      "Status zamówienia został w międzyczasie zmieniony – pobierz zamówienie i spróbuj ponownie",
    );
  }
  const updated = await prisma.order.findUniqueOrThrow({ where: { id: args.orderId } });

  // Notify watchers only after the change has been saved.
  emitOrderStatusChanged({
    orderId: updated.id,
    status: updated.status as OrderStatus,
    trackingNumber: updated.trackingNumber,
    changedAt: updated.updatedAt,
  });

  return toOrderView(updated);
}
