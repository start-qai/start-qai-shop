import type {
  sendUnaryData,
  ServerUnaryCall,
  ServerWritableStream,
  UntypedServiceImplementation,
} from "@grpc/grpc-js";
import {
  OrderError,
  validateListFilter,
  validateOrderId,
  validateUpdateArgs,
  type OrderStatus,
} from "../lib/order-status.js";
import { onOrderStatusChanged, type OrderStatusChangedEvent } from "../lib/order-events.js";
import {
  findOrder,
  getOrderDetails,
  listOrders,
  updateOrderStatus,
} from "../services/order.service.js";
import { checkAuth } from "./auth.js";
import { toServiceError } from "./errors.js";
import {
  toOrderMessage,
  toStatusEventMessage,
  type OrderMessage,
  type OrderStatusEventMessage,
} from "./mappers.js";

interface GetOrderRequest {
  orderId?: string;
}

interface ListOrdersRequest {
  status?: string | number;
}

interface UpdateOrderStatusRequest {
  orderId?: string;
  status?: string | number;
  trackingNumber?: string;
}

interface WatchOrderRequest {
  orderId?: string;
}

/** Wraps an async unary handler: result => callback(null, result), error => gRPC status. */
function unary<Req, Res>(handler: (call: ServerUnaryCall<Req, Res>) => Promise<Res>) {
  return (call: ServerUnaryCall<Req, Res>, callback: sendUnaryData<Res>) => {
    handler(call)
      .then((res) => callback(null, res))
      .catch((err: unknown) => callback(toServiceError(err)));
  };
}

const getOrder = unary<GetOrderRequest, OrderMessage>(async (call) => {
  checkAuth(call.metadata);
  const orderId = validateOrderId(call.request.orderId);
  return toOrderMessage(await getOrderDetails(orderId));
});

const listOrdersHandler = unary<ListOrdersRequest, { orders: OrderMessage[] }>(async (call) => {
  checkAuth(call.metadata);
  const status = validateListFilter(call.request.status);
  const orders = await listOrders(status);
  return { orders: orders.map(toOrderMessage) };
});

const updateOrderStatusHandler = unary<UpdateOrderStatusRequest, OrderMessage>(async (call) => {
  // 1. auth -> 2. arguments (no DB) -> 3. existence -> 4. lifecycle transition
  checkAuth(call.metadata);
  const args = validateUpdateArgs(
    call.request.orderId,
    call.request.status,
    call.request.trackingNumber,
  );
  return toOrderMessage(await updateOrderStatus(args));
});

/**
 * Server streaming: sends the current status, then every successful change.
 * Closes the stream (status OK) once the order is DELIVERED.
 */
async function watchOrder(
  call: ServerWritableStream<WatchOrderRequest, OrderStatusEventMessage>,
): Promise<void> {
  let unsubscribe: (() => void) | null = null;
  let closed = false;
  let initialSent = false;
  let lastStatus: OrderStatus | null = null;
  const pending: OrderStatusChangedEvent[] = [];

  const cleanup = () => {
    closed = true;
    unsubscribe?.();
    unsubscribe = null;
  };

  const send = (event: OrderStatusChangedEvent) => {
    // Skip duplicates (e.g. a change that happened exactly while subscribing).
    if (closed || event.status === lastStatus) {
      return;
    }
    lastStatus = event.status;
    call.write(toStatusEventMessage(event));
    if (event.status === "DELIVERED") {
      cleanup();
      call.end();
    }
  };

  call.on("cancelled", cleanup);

  try {
    const orderId = validateOrderId(call.request.orderId);

    // Subscribe BEFORE reading the current state so no change is lost in between.
    // Events that arrive before the initial event is sent are buffered.
    unsubscribe = onOrderStatusChanged(orderId, (event) => {
      if (initialSent) {
        send(event);
      } else {
        pending.push(event);
      }
    });

    const order = await findOrder(orderId);
    if (!order) {
      throw OrderError.notFound(orderId);
    }
    if (closed) {
      return;
    }

    send({
      orderId: order.id,
      status: order.status as OrderStatus,
      trackingNumber: order.trackingNumber,
      changedAt: order.updatedAt,
    });
    initialSent = true;
    pending.splice(0).forEach(send);
  } catch (err) {
    cleanup();
    call.emit("error", toServiceError(err));
  }
}

export const orderServiceHandlers: UntypedServiceImplementation = {
  GetOrder: getOrder,
  ListOrders: listOrdersHandler,
  UpdateOrderStatus: updateOrderStatusHandler,
  WatchOrder: (call: ServerWritableStream<WatchOrderRequest, OrderStatusEventMessage>) => {
    void watchOrder(call);
  },
};
