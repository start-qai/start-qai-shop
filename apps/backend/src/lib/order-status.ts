/**
 * Order lifecycle rules (pure functions, no database access).
 *
 * Lifecycle: PAID -> SHIPPED -> DELIVERED (one step forward only, DELIVERED is final).
 * Statuses are stored in the database / REST without a prefix ("PAID"); in gRPC they are
 * enum values with the ORDER_STATUS_ prefix ("ORDER_STATUS_PAID").
 */

export const ORDER_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const MAX_TRACKING_NUMBER_LENGTH = 64;

const PROTO_PREFIX = "ORDER_STATUS_";
const PROTO_UNSPECIFIED = "ORDER_STATUS_UNSPECIFIED";

/** The only allowed next status for each status (DELIVERED has none). */
const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PAID: "SHIPPED",
  SHIPPED: "DELIVERED",
  DELIVERED: null,
};

export type OrderErrorKind = "INVALID_ARGUMENT" | "NOT_FOUND" | "FAILED_PRECONDITION";

/** Domain error – mapped to a gRPC status code by the transport layer. */
export class OrderError extends Error {
  public readonly kind: OrderErrorKind;

  constructor(kind: OrderErrorKind, message: string) {
    super(message);
    this.name = "OrderError";
    this.kind = kind;
  }

  static invalidArgument(message: string) {
    return new OrderError("INVALID_ARGUMENT", message);
  }

  static notFound(orderId: string) {
    // Keep the message short – it travels in the grpc-message trailer (clients limit header size).
    const shown = orderId.length > 64 ? `${orderId.slice(0, 64)}…` : orderId;
    return new OrderError("NOT_FOUND", `Zamówienie o id '${shown}' nie istnieje`);
  }

  static failedPrecondition(message: string) {
    return new OrderError("FAILED_PRECONDITION", message);
  }
}

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

/** "PAID" -> "ORDER_STATUS_PAID" */
export function toProtoStatus(status: string): string {
  return `${PROTO_PREFIX}${status}`;
}

/**
 * "ORDER_STATUS_PAID" -> "PAID". Returns null for ORDER_STATUS_UNSPECIFIED and for any unknown
 * value (protobufjs decodes an enum number outside the enum, e.g. 99, as a plain number).
 */
export function fromProtoStatus(value: unknown): OrderStatus | null {
  if (typeof value !== "string" || !value.startsWith(PROTO_PREFIX)) {
    return null;
  }
  const status = value.slice(PROTO_PREFIX.length);
  return isOrderStatus(status) ? status : null;
}

export function validateOrderId(orderId: unknown): string {
  if (typeof orderId !== "string" || orderId === "") {
    throw OrderError.invalidArgument("Pole order_id jest wymagane");
  }
  return orderId;
}

export interface UpdateArgs {
  orderId: string;
  status: OrderStatus;
  /** Set only when moving to SHIPPED; otherwise null (the stored value is kept). */
  trackingNumber: string | null;
}

/** Validates UpdateOrderStatus arguments – runs BEFORE any database lookup. */
export function validateUpdateArgs(
  orderId: unknown,
  status: unknown,
  trackingNumber: unknown,
): UpdateArgs {
  const id = validateOrderId(orderId);

  const target = fromProtoStatus(status);
  if (!target) {
    throw OrderError.invalidArgument(
      "Pole status jest wymagane i musi mieć wartość ORDER_STATUS_PAID, ORDER_STATUS_SHIPPED lub ORDER_STATUS_DELIVERED",
    );
  }

  if (target !== "SHIPPED") {
    return { orderId: id, status: target, trackingNumber: null };
  }

  const tracking = typeof trackingNumber === "string" ? trackingNumber.trim() : "";
  if (tracking === "") {
    throw OrderError.invalidArgument(
      "Pole tracking_number jest wymagane przy zmianie statusu na ORDER_STATUS_SHIPPED",
    );
  }
  // Count characters (code points), not UTF-16 units – an emoji is one character.
  if ([...tracking].length > MAX_TRACKING_NUMBER_LENGTH) {
    throw OrderError.invalidArgument(
      `Pole tracking_number może mieć maksymalnie ${MAX_TRACKING_NUMBER_LENGTH} znaki`,
    );
  }
  return { orderId: id, status: target, trackingNumber: tracking };
}

/** Validates the lifecycle transition – runs AFTER the order has been loaded. */
export function validateTransition(current: OrderStatus, target: OrderStatus): void {
  if (current === target) {
    throw OrderError.failedPrecondition(`Zamówienie ma już status ${toProtoStatus(current)}`);
  }
  const next = NEXT_STATUS[current];
  if (next === null) {
    throw OrderError.failedPrecondition(
      `Zamówienie ma status ${toProtoStatus(current)} – nie można już zmienić jego statusu`,
    );
  }
  if (next !== target) {
    throw OrderError.failedPrecondition(
      `Niedozwolona zmiana statusu z ${toProtoStatus(current)} na ${toProtoStatus(target)} – dozwolona jest tylko zmiana na ${toProtoStatus(next)}`,
    );
  }
}

/** Validates the optional ListOrders filter. ORDER_STATUS_UNSPECIFIED = no filter. */
export function validateListFilter(status: unknown): OrderStatus | undefined {
  if (status === undefined || status === null || status === PROTO_UNSPECIFIED || status === 0) {
    return undefined;
  }
  const parsed = fromProtoStatus(status);
  if (!parsed) {
    throw OrderError.invalidArgument("Nieprawidłowa wartość filtra status");
  }
  return parsed;
}
