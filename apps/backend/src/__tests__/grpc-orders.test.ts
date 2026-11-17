import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import {
  credentials,
  Metadata,
  status,
  type Client,
  type ClientReadableStream,
  type ServiceError,
} from "@grpc/grpc-js";
import type { Server } from "@grpc/grpc-js";
import { createApp } from "../app.js";
import { prisma } from "../prisma.js";
import {
  getOrderServiceConstructor,
  loadReflectionPackageDefinition,
  startGrpcServer,
} from "../grpc/server.js";
import { orderListenerCount } from "../lib/order-events.js";
import { resetDb, authHeader, TOKEN, seedProducts } from "./helpers.js";

/* eslint-disable @typescript-eslint/no-explicit-any */

const app = createApp();
let server: Server;
let client: Client & Record<string, any>;

beforeAll(async () => {
  const started = await startGrpcServer("127.0.0.1", 0);
  server = started.server;
  const OrderService = getOrderServiceConstructor();
  client = new OrderService(`127.0.0.1:${started.port}`, credentials.createInsecure()) as Client &
    Record<string, any>;
});

afterAll(async () => {
  client.close();
  await new Promise<void>((resolve) => server.tryShutdown(() => resolve()));
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetDb();
});

/* ------------------------------ helpers ------------------------------ */

const authMeta = (token: string | null = TOKEN) => {
  const md = new Metadata();
  if (token !== null) md.set("authorization", `Bearer ${token}`);
  return md;
};

function call<T = any>(method: string, req: object, md: Metadata = authMeta()): Promise<T> {
  return new Promise((resolve, reject) => {
    client[method](req, md, (err: ServiceError | null, res: T) =>
      err ? reject(err) : resolve(res),
    );
  });
}

async function expectCode(promise: Promise<unknown>, code: status) {
  const err = (await promise.then(
    () => null,
    (e: ServiceError) => e,
  )) as ServiceError | null;
  expect(err, "expected the call to fail").not.toBeNull();
  expect(err!.code).toBe(code);
}

/** Creates an order directly in the DB. */
async function createOrder(
  id: string,
  opts: { status?: string; trackingNumber?: string | null; createdAt?: string } = {},
) {
  const createdAt = new Date(opts.createdAt ?? "2026-02-01T10:00:00.000Z");
  const items = [
    {
      productId: "p-1",
      title: "Produkt 1",
      price: 10.5,
      currency: "PLN",
      imageUrl: "/x.png",
      quantity: 2,
      lineTotal: 21,
    },
    {
      productId: "p-2",
      title: "Produkt 2",
      price: 4.99,
      currency: "PLN",
      imageUrl: "/x.png",
      quantity: 1,
      lineTotal: 4.99,
    },
  ];
  return prisma.order.create({
    data: {
      id,
      status: opts.status ?? "PAID",
      trackingNumber: opts.trackingNumber ?? null,
      totalPrice: 25.99,
      itemsJson: JSON.stringify(items),
      createdAt,
      updatedAt: createdAt,
    },
  });
}

interface WatchHandle {
  events: any[];
  stream: ClientReadableStream<any>;
  done: Promise<{ error: ServiceError | null }>;
  waitFor: (count: number) => Promise<void>;
}

function watch(orderId: string, md: Metadata = authMeta()): WatchHandle {
  const stream = client.WatchOrder({ orderId }, md) as ClientReadableStream<any>;
  const events: any[] = [];
  const waiters: { count: number; resolve: () => void }[] = [];
  stream.on("data", (ev) => {
    events.push(ev);
    waiters.filter((w) => events.length >= w.count).forEach((w) => w.resolve());
  });
  const done = new Promise<{ error: ServiceError | null }>((resolve) => {
    stream.on("error", (error: ServiceError) => resolve({ error }));
    stream.on("end", () => resolve({ error: null }));
  });
  const waitFor = (count: number) =>
    events.length >= count
      ? Promise.resolve()
      : new Promise<void>((resolve) => waiters.push({ count, resolve }));
  return { events, stream, done, waitFor };
}

const ship = (orderId: string, tracking = "PL-123") =>
  call("UpdateOrderStatus", { orderId, status: "ORDER_STATUS_SHIPPED", trackingNumber: tracking });
const deliver = (orderId: string) =>
  call("UpdateOrderStatus", { orderId, status: "ORDER_STATUS_DELIVERED" });

/* ------------------------------- tests ------------------------------- */

describe("gRPC OrderService – GetOrder", () => {
  it("requires a valid token", async () => {
    await createOrder("o-auth");
    await expectCode(
      call("GetOrder", { orderId: "o-auth" }, authMeta(null)),
      status.UNAUTHENTICATED,
    );
    await expectCode(
      call("GetOrder", { orderId: "o-auth" }, authMeta("zly")),
      status.UNAUTHENTICATED,
    );
  });

  it("returns the order", async () => {
    await createOrder("o-get");
    const order = await call("GetOrder", { orderId: "o-get" });
    expect(order).toMatchObject({
      id: "o-get",
      status: "ORDER_STATUS_PAID",
      totalItems: 3,
      totalPrice: 25.99,
      currency: "PLN",
      trackingNumber: "",
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: "2026-02-01T10:00:00.000Z",
    });
    expect(order.items).toEqual([
      { productId: "p-1", title: "Produkt 1", quantity: 2, price: 10.5, lineTotal: 21 },
      { productId: "p-2", title: "Produkt 2", quantity: 1, price: 4.99, lineTotal: 4.99 },
    ]);
  });

  it("returns INVALID_ARGUMENT for an empty id and NOT_FOUND for an unknown id", async () => {
    await expectCode(call("GetOrder", { orderId: "" }), status.INVALID_ARGUMENT);
    await expectCode(call("GetOrder", { orderId: "abc" }), status.NOT_FOUND);
    await expectCode(call("GetOrder", { orderId: "x".repeat(500) }), status.NOT_FOUND);
  });
});

describe("gRPC OrderService – ListOrders", () => {
  it("requires a valid token", async () => {
    await createOrder("o-auth");
    await expectCode(call("ListOrders", {}, authMeta(null)), status.UNAUTHENTICATED);
    await expectCode(call("ListOrders", {}, authMeta("zly")), status.UNAUTHENTICATED);
  });

  it("returns orders newest first, ties broken by id descending", async () => {
    await createOrder("o-a", { createdAt: "2026-02-01T10:00:00.000Z" });
    await createOrder("o-b", { createdAt: "2026-02-01T10:00:00.000Z" });
    await createOrder("o-c", { createdAt: "2026-02-02T10:00:00.000Z" });
    const res = await call("ListOrders", {});
    expect(res.orders.map((o: any) => o.id)).toEqual(["o-c", "o-b", "o-a"]);
  });

  it("filters by status; UNSPECIFIED means no filter", async () => {
    await createOrder("o-paid");
    await createOrder("o-shipped", { status: "SHIPPED", trackingNumber: "T-1" });
    const shipped = await call("ListOrders", { status: "ORDER_STATUS_SHIPPED" });
    expect(shipped.orders.map((o: any) => o.id)).toEqual(["o-shipped"]);
    const all = await call("ListOrders", { status: "ORDER_STATUS_UNSPECIFIED" });
    expect(all.orders).toHaveLength(2);
  });

  it("returns an empty list when there are no orders", async () => {
    expect((await call("ListOrders", {})).orders).toEqual([]);
  });

  it("rejects an unknown enum value (99) with INVALID_ARGUMENT", async () => {
    await expectCode(call("ListOrders", { status: 99 }), status.INVALID_ARGUMENT);
  });
});

describe("gRPC OrderService – UpdateOrderStatus", () => {
  it("requires a valid token", async () => {
    await createOrder("o-auth");
    await expectCode(
      call(
        "UpdateOrderStatus",
        { orderId: "o-auth", status: "ORDER_STATUS_SHIPPED", trackingNumber: "T-1" },
        authMeta(null),
      ),
      status.UNAUTHENTICATED,
    );
    await expectCode(
      call(
        "UpdateOrderStatus",
        { orderId: "o-auth", status: "ORDER_STATUS_SHIPPED", trackingNumber: "T-1" },
        authMeta("zly"),
      ),
      status.UNAUTHENTICATED,
    );
  });

  it("moves PAID -> SHIPPED -> DELIVERED and keeps the tracking number", async () => {
    await createOrder("o-flow");
    const shipped = await ship("o-flow", "  PL-TRACK-9  ");
    expect(shipped).toMatchObject({ status: "ORDER_STATUS_SHIPPED", trackingNumber: "PL-TRACK-9" });
    expect(shipped.totalPrice).toBe(25.99);

    const delivered = await call("UpdateOrderStatus", {
      orderId: "o-flow",
      status: "ORDER_STATUS_DELIVERED",
      trackingNumber: "IGNORED",
    });
    expect(delivered).toMatchObject({
      status: "ORDER_STATUS_DELIVERED",
      trackingNumber: "PL-TRACK-9",
    });
    expect(new Date(delivered.updatedAt).getTime()).toBeGreaterThan(
      new Date(delivered.createdAt).getTime(),
    );
  });

  it.each([
    ["ORDER_STATUS_UNSPECIFIED", ""],
    [99, ""],
    ["ORDER_STATUS_SHIPPED", ""],
    ["ORDER_STATUS_SHIPPED", "   "],
    ["ORDER_STATUS_SHIPPED", "A".repeat(65)],
  ])("rejects status=%s tracking=%j with INVALID_ARGUMENT", async (st, tracking) => {
    await createOrder("o-inv");
    await expectCode(
      call("UpdateOrderStatus", { orderId: "o-inv", status: st, trackingNumber: tracking }),
      status.INVALID_ARGUMENT,
    );
  });

  it("lets only one of two concurrent identical changes succeed", async () => {
    await createOrder("o-race");
    const results = await Promise.allSettled([ship("o-race", "T-A"), ship("o-race", "T-B")]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0].reason as ServiceError).code).toBe(status.FAILED_PRECONDITION);
  });

  it("returns NOT_FOUND for an unknown order", async () => {
    await expectCode(ship("nie-ma"), status.NOT_FOUND);
  });

  it.each([
    ["PAID", "ORDER_STATUS_DELIVERED"],
    ["PAID", "ORDER_STATUS_PAID"],
    ["SHIPPED", "ORDER_STATUS_PAID"],
    ["DELIVERED", "ORDER_STATUS_SHIPPED"],
  ])("rejects %s -> %s with FAILED_PRECONDITION", async (from, to) => {
    await createOrder("o-pre", { status: from, trackingNumber: from === "PAID" ? null : "T-1" });
    await expectCode(
      call("UpdateOrderStatus", { orderId: "o-pre", status: to, trackingNumber: "T-2" }),
      status.FAILED_PRECONDITION,
    );
  });

  it("checks arguments before existence (unknown id + invalid args => INVALID_ARGUMENT)", async () => {
    await expectCode(
      call("UpdateOrderStatus", { orderId: "nie-ma", status: "ORDER_STATUS_UNSPECIFIED" }),
      status.INVALID_ARGUMENT,
    );
    await expectCode(
      call("UpdateOrderStatus", { orderId: "nie-ma", status: "ORDER_STATUS_SHIPPED" }),
      status.INVALID_ARGUMENT,
    );
  });

  it("checks auth before arguments", async () => {
    await expectCode(
      call("UpdateOrderStatus", { orderId: "", status: 99 }, authMeta(null)),
      status.UNAUTHENTICATED,
    );
  });

  it("checks existence before the transition", async () => {
    await expectCode(deliver("nie-ma"), status.NOT_FOUND);
  });
});

describe("gRPC OrderService – consistency with REST checkout", () => {
  it("an order created via REST checkout is visible in ListOrders with the same data", async () => {
    await seedProducts();
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: "qai-mug", quantity: 2 });
    await request(app)
      .post("/api/cart")
      .set(authHeader)
      .send({ productId: "qai-stickers", quantity: 1 });
    const checkout = await request(app).post("/api/checkout").set(authHeader);
    expect(checkout.status).toBe(201);

    const { orders } = await call("ListOrders", {});
    expect(orders).toHaveLength(1);
    const order = orders[0];
    expect(order).toMatchObject({
      id: checkout.body.orderId,
      status: "ORDER_STATUS_PAID",
      totalItems: checkout.body.totalItems,
      totalPrice: checkout.body.totalPrice,
      currency: checkout.body.currency,
      createdAt: checkout.body.createdAt,
      updatedAt: checkout.body.createdAt,
    });
    expect(order.items).toEqual(
      checkout.body.items.map((it: any) => ({
        productId: it.productId,
        title: it.title,
        quantity: it.quantity,
        price: it.price,
        lineTotal: it.lineTotal,
      })),
    );
  });
});

describe("gRPC OrderService – WatchOrder", () => {
  it("sends the current status, every change, and closes after DELIVERED", async () => {
    await createOrder("o-watch");
    const w = watch("o-watch");
    await w.waitFor(1);
    await ship("o-watch", "PL-W-1");
    await w.waitFor(2);
    await deliver("o-watch");
    const { error } = await w.done;

    expect(error).toBeNull();
    expect(w.events.map((e) => e.status)).toEqual([
      "ORDER_STATUS_PAID",
      "ORDER_STATUS_SHIPPED",
      "ORDER_STATUS_DELIVERED",
    ]);
    expect(w.events[0]).toMatchObject({
      orderId: "o-watch",
      trackingNumber: "",
      changedAt: "2026-02-01T10:00:00.000Z",
    });
    expect(w.events[2].trackingNumber).toBe("PL-W-1");
    expect(orderListenerCount("o-watch")).toBe(0);
  });

  it("does not emit events for failed status changes", async () => {
    await createOrder("o-fail");
    const w = watch("o-fail");
    await w.waitFor(1);
    await expectCode(deliver("o-fail"), status.FAILED_PRECONDITION);
    await ship("o-fail");
    await w.waitFor(2);
    w.stream.cancel();
    await w.done;
    expect(w.events.map((e) => e.status)).toEqual(["ORDER_STATUS_PAID", "ORDER_STATUS_SHIPPED"]);
  });

  it("sends one event and closes immediately for an already DELIVERED order", async () => {
    await createOrder("o-done", { status: "DELIVERED", trackingNumber: "T-9" });
    const w = watch("o-done");
    const { error } = await w.done;
    expect(error).toBeNull();
    expect(w.events).toHaveLength(1);
    expect(w.events[0]).toMatchObject({ status: "ORDER_STATUS_DELIVERED", trackingNumber: "T-9" });
  });

  it("returns NOT_FOUND / INVALID_ARGUMENT as stream status before any event", async () => {
    const missing = watch("nie-ma");
    expect((await missing.done).error?.code).toBe(status.NOT_FOUND);
    expect(missing.events).toHaveLength(0);

    const empty = watch("");
    expect((await empty.done).error?.code).toBe(status.INVALID_ARGUMENT);
    expect(empty.events).toHaveLength(0);
  });

  it("delivers the same events to parallel watchers without extra events", async () => {
    await createOrder("o-multi");
    const a = watch("o-multi");
    const b = watch("o-multi");
    await Promise.all([a.waitFor(1), b.waitFor(1)]);
    await ship("o-multi");
    await deliver("o-multi");
    await Promise.all([a.done, b.done]);
    const expected = ["ORDER_STATUS_PAID", "ORDER_STATUS_SHIPPED", "ORDER_STATUS_DELIVERED"];
    expect(a.events.map((e) => e.status)).toEqual(expected);
    expect(b.events.map((e) => e.status)).toEqual(expected);
  });

  it("cleans up the subscription when the client cancels", async () => {
    await createOrder("o-cancel");
    const w = watch("o-cancel");
    await w.waitFor(1);
    expect(orderListenerCount("o-cancel")).toBe(1);
    w.stream.cancel();
    expect((await w.done).error?.code).toBe(status.CANCELLED);
    for (let i = 0; i < 50 && orderListenerCount("o-cancel") > 0; i++) {
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(orderListenerCount("o-cancel")).toBe(0);
  });
});

describe("gRPC OrderService – reflection", () => {
  it("exposes the original snake_case field names from the .proto (as used by grpcurl)", () => {
    const def = loadReflectionPackageDefinition() as any;
    const fields = (type: string) =>
      def[`qaishop.orders.v1.${type}`].type.field.map((f: any) => f.name);
    expect(fields("GetOrderRequest")).toEqual(["order_id"]);
    expect(fields("UpdateOrderStatusRequest")).toEqual(["order_id", "status", "tracking_number"]);
    expect(fields("Order")).toContain("total_price");
  });
});
