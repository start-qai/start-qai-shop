import { describe, it, expect } from "vitest";
import {
  OrderError,
  fromProtoStatus,
  toProtoStatus,
  validateListFilter,
  validateTransition,
  validateUpdateArgs,
  type OrderStatus,
} from "../lib/order-status.js";

const kindOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return err instanceof OrderError ? err.kind : "OTHER";
  }
  return "NONE";
};

describe("order status mapping", () => {
  it("maps between DB and proto names", () => {
    expect(toProtoStatus("PAID")).toBe("ORDER_STATUS_PAID");
    expect(fromProtoStatus("ORDER_STATUS_DELIVERED")).toBe("DELIVERED");
  });

  it("returns null for UNSPECIFIED, unknown names and numbers", () => {
    expect(fromProtoStatus("ORDER_STATUS_UNSPECIFIED")).toBeNull();
    expect(fromProtoStatus("PAID")).toBeNull();
    expect(fromProtoStatus(99)).toBeNull();
    expect(fromProtoStatus(undefined)).toBeNull();
  });
});

describe("validateTransition", () => {
  const allowed: [OrderStatus, OrderStatus][] = [
    ["PAID", "SHIPPED"],
    ["SHIPPED", "DELIVERED"],
  ];
  const forbidden: [OrderStatus, OrderStatus][] = [
    ["PAID", "DELIVERED"],
    ["PAID", "PAID"],
    ["SHIPPED", "PAID"],
    ["SHIPPED", "SHIPPED"],
    ["DELIVERED", "PAID"],
    ["DELIVERED", "SHIPPED"],
    ["DELIVERED", "DELIVERED"],
  ];

  it.each(allowed)("allows %s -> %s", (from, to) => {
    expect(kindOf(() => validateTransition(from, to))).toBe("NONE");
  });

  it.each(forbidden)("rejects %s -> %s with FAILED_PRECONDITION", (from, to) => {
    expect(kindOf(() => validateTransition(from, to))).toBe("FAILED_PRECONDITION");
  });
});

describe("validateUpdateArgs", () => {
  it("requires order_id", () => {
    expect(kindOf(() => validateUpdateArgs("", "ORDER_STATUS_SHIPPED", "X"))).toBe(
      "INVALID_ARGUMENT",
    );
  });

  it.each(["ORDER_STATUS_UNSPECIFIED", 99, undefined])("rejects status %s", (status) => {
    expect(kindOf(() => validateUpdateArgs("o1", status, ""))).toBe("INVALID_ARGUMENT");
  });

  it("requires a tracking number for SHIPPED (whitespace counts as missing)", () => {
    expect(kindOf(() => validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", ""))).toBe(
      "INVALID_ARGUMENT",
    );
    expect(kindOf(() => validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", "   "))).toBe(
      "INVALID_ARGUMENT",
    );
  });

  it("limits the tracking number to 64 characters after trimming", () => {
    expect(validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", ` ${"A".repeat(64)} `)).toEqual({
      orderId: "o1",
      status: "SHIPPED",
      trackingNumber: "A".repeat(64),
    });
    expect(kindOf(() => validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", "A".repeat(65)))).toBe(
      "INVALID_ARGUMENT",
    );
  });

  it("counts characters, not UTF-16 units (emoji and Polish letters)", () => {
    expect(validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", "📦".repeat(64)).trackingNumber).toBe(
      "📦".repeat(64),
    );
    expect(kindOf(() => validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", "📦".repeat(65)))).toBe(
      "INVALID_ARGUMENT",
    );
    expect(validateUpdateArgs("o1", "ORDER_STATUS_SHIPPED", "ą".repeat(64)).trackingNumber).toBe(
      "ą".repeat(64),
    );
  });

  it("keeps the NOT_FOUND message short for very long ids", () => {
    expect(OrderError.notFound("x".repeat(100_000)).message.length).toBeLessThan(120);
  });

  it("ignores the tracking number for DELIVERED", () => {
    expect(validateUpdateArgs("o1", "ORDER_STATUS_DELIVERED", "IGNORED")).toEqual({
      orderId: "o1",
      status: "DELIVERED",
      trackingNumber: null,
    });
  });
});

describe("validateListFilter", () => {
  it("treats UNSPECIFIED / missing as no filter", () => {
    expect(validateListFilter("ORDER_STATUS_UNSPECIFIED")).toBeUndefined();
    expect(validateListFilter(undefined)).toBeUndefined();
  });

  it("accepts known statuses and rejects unknown values", () => {
    expect(validateListFilter("ORDER_STATUS_SHIPPED")).toBe("SHIPPED");
    expect(kindOf(() => validateListFilter(99))).toBe("INVALID_ARGUMENT");
  });
});
