import { status, type Metadata } from "@grpc/grpc-js";
import { AUTH_HEADER } from "@qai-shop/shared";
import { AUTH_MESSAGES, checkBearer } from "../lib/auth-token.js";
import { RpcError } from "./errors.js";

/**
 * Checks the `authorization: Bearer <token>` metadata entry – same rules as the REST API.
 * Throws RpcError(UNAUTHENTICATED) when the token is missing or invalid.
 */
export function checkAuth(metadata: Metadata): void {
  const [value] = metadata.get(AUTH_HEADER);
  const result = checkBearer(typeof value === "string" ? value : undefined);
  if (result !== "ok") {
    throw new RpcError(status.UNAUTHENTICATED, AUTH_MESSAGES[result]);
  }
}
