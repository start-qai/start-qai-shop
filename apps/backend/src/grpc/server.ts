import { fileURLToPath } from "node:url";
import {
  loadPackageDefinition,
  Server,
  ServerCredentials,
  type ServiceClientConstructor,
} from "@grpc/grpc-js";
import { loadSync, type PackageDefinition } from "@grpc/proto-loader";
import { ReflectionService } from "@grpc/reflection";
import { orderServiceHandlers } from "./order.handlers.js";

/** Path to the OrderService contract (apps/backend/proto/orders.proto). */
export const ORDERS_PROTO_PATH = fileURLToPath(
  new URL("../../proto/orders.proto", import.meta.url),
);

/**
 * proto-loader options – shared with test clients:
 * camelCase fields, enums as names ("ORDER_STATUS_PAID"), default values always present.
 */
export const PROTO_LOADER_OPTIONS = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
} as const;

export function loadOrdersPackageDefinition(): PackageDefinition {
  return loadSync(ORDERS_PROTO_PATH, PROTO_LOADER_OPTIONS);
}

/**
 * Definition for server reflection. Must keep the original snake_case field names from the
 * .proto (keepCase: true) – otherwise tools like grpcurl see camelCase names (orderId) and
 * reject requests that use the names from the contract (order_id).
 */
export function loadReflectionPackageDefinition(): PackageDefinition {
  return loadSync(ORDERS_PROTO_PATH, { ...PROTO_LOADER_OPTIONS, keepCase: true });
}

/** Constructor of the generated OrderService client/service definition. */
export function getOrderServiceConstructor(
  packageDefinition: PackageDefinition = loadOrdersPackageDefinition(),
): ServiceClientConstructor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grpcObject = loadPackageDefinition(packageDefinition) as any;
  return grpcObject.qaishop.orders.v1.OrderService as ServiceClientConstructor;
}

/** Creates a gRPC server with OrderService and server reflection (does not bind). */
export function createGrpcServer(): Server {
  const packageDefinition = loadOrdersPackageDefinition();
  const server = new Server();
  server.addService(getOrderServiceConstructor(packageDefinition).service, orderServiceHandlers);
  new ReflectionService(loadReflectionPackageDefinition()).addToServer(server);
  return server;
}

/**
 * Starts the gRPC server. Port 0 picks a random free port (used in tests).
 * Resolves with the server and the actual bound port.
 */
export function startGrpcServer(
  host: string,
  port: number,
): Promise<{ server: Server; port: number }> {
  const server = createGrpcServer();
  return new Promise((resolve, reject) => {
    server.bindAsync(`${host}:${port}`, ServerCredentials.createInsecure(), (err, boundPort) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ server, port: boundPort });
    });
  });
}
