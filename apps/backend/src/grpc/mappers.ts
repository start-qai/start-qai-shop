import { toProtoStatus } from "../lib/order-status.js";
import type { OrderStatusChangedEvent } from "../lib/order-events.js";
import type { OrderView } from "../services/order.service.js";

/**
 * Plain JS shapes of the proto messages (proto-loader with keepCase: false => camelCase fields,
 * enums: String => enum values as names, e.g. "ORDER_STATUS_PAID").
 */
export interface OrderItemMessage {
  productId: string;
  title: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

export interface OrderMessage {
  id: string;
  status: string;
  items: OrderItemMessage[];
  totalItems: number;
  totalPrice: number;
  currency: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusEventMessage {
  orderId: string;
  status: string;
  trackingNumber: string;
  changedAt: string;
}

export function toOrderMessage(order: OrderView): OrderMessage {
  return {
    id: order.id,
    status: toProtoStatus(order.status),
    items: order.items.map((it) => ({
      productId: it.productId,
      title: it.title,
      quantity: it.quantity,
      price: it.price,
      lineTotal: it.lineTotal,
    })),
    totalItems: order.totalItems,
    totalPrice: order.totalPrice,
    currency: order.currency,
    trackingNumber: order.trackingNumber ?? "",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toStatusEventMessage(event: OrderStatusChangedEvent): OrderStatusEventMessage {
  return {
    orderId: event.orderId,
    status: toProtoStatus(event.status),
    trackingNumber: event.trackingNumber ?? "",
    changedAt: event.changedAt.toISOString(),
  };
}
