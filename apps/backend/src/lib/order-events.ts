import { EventEmitter } from "node:events";
import type { OrderStatus } from "./order-status.js";

/** In-process notification about a successful order status change (used by WatchOrder). */
export interface OrderStatusChangedEvent {
  orderId: string;
  status: OrderStatus;
  trackingNumber: string | null;
  changedAt: Date;
}

const emitter = new EventEmitter();
// Many WatchOrder subscribers may observe orders at the same time – no listener limit warnings.
emitter.setMaxListeners(0);

const eventName = (orderId: string) => `order:${orderId}`;

export function emitOrderStatusChanged(event: OrderStatusChangedEvent): void {
  emitter.emit(eventName(event.orderId), event);
}

/** Subscribes to status changes of one order. Returns an unsubscribe function. */
export function onOrderStatusChanged(
  orderId: string,
  listener: (event: OrderStatusChangedEvent) => void,
): () => void {
  emitter.on(eventName(orderId), listener);
  return () => {
    emitter.off(eventName(orderId), listener);
  };
}

/** Number of active subscribers for an order (used in tests to verify cleanup). */
export function orderListenerCount(orderId: string): number {
  return emitter.listenerCount(eventName(orderId));
}
