import type { Request, Response, NextFunction } from "express";
import { AUTH_HEADER } from "@qai-shop/shared";
import { HttpError } from "../lib/http-error.js";
import { AUTH_MESSAGES, checkBearer } from "../lib/auth-token.js";

/**
 * Authorization middleware – SIMULATED (training).
 * Only a single hardcoded token (config.authToken) is accepted => anything else => 401.
 * The token check itself lives in lib/auth-token.ts (shared with the gRPC server).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const result = checkBearer(req.headers[AUTH_HEADER]);
  if (result !== "ok") {
    throw HttpError.unauthorized(AUTH_MESSAGES[result]);
  }
  next();
}
