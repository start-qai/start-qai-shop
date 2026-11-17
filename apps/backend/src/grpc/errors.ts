import { Metadata, status, type ServiceError } from "@grpc/grpc-js";
import { OrderError, type OrderErrorKind } from "../lib/order-status.js";

/** Error that already carries a gRPC status code (e.g. UNAUTHENTICATED). */
export class RpcError extends Error {
  public readonly code: status;

  constructor(code: status, message: string) {
    super(message);
    this.name = "RpcError";
    this.code = code;
  }
}

const KIND_TO_CODE: Record<OrderErrorKind, status> = {
  INVALID_ARGUMENT: status.INVALID_ARGUMENT,
  NOT_FOUND: status.NOT_FOUND,
  FAILED_PRECONDITION: status.FAILED_PRECONDITION,
};

/** Maps any thrown value to a gRPC ServiceError (unexpected errors => INTERNAL). */
export function toServiceError(err: unknown): Partial<ServiceError> {
  if (err instanceof RpcError) {
    return { code: err.code, details: err.message, metadata: new Metadata() };
  }
  if (err instanceof OrderError) {
    return { code: KIND_TO_CODE[err.kind], details: err.message, metadata: new Metadata() };
  }
  // eslint-disable-next-line no-console
  console.error("[gRPC unhandled error]", err);
  return {
    code: status.INTERNAL,
    details: "Wystąpił nieoczekiwany błąd serwera",
    metadata: new Metadata(),
  };
}
